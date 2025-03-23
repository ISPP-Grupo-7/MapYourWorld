import { EntityRepository, Repository } from 'typeorm';
import { Friend, FriendStatus } from '../models/friend.model';
import { User } from '../../../auth-service/src/models/user.model';
import { AppDataSource } from '../../../database/appDataSource'; // Importa la instancia de conexión
import { UserProfile } from '../../../user-service/src/models/userProfile.model';


export default class FriendRepository  {
  private friendRepo: Repository<Friend>;
  private userProfileRepo: Repository<UserProfile>;
  private userRepo: Repository<User>;
  /**
   * Encuentra todas las relaciones de amistad por userId y estado.
   */

  constructor() {
    this.friendRepo = AppDataSource.getRepository(Friend);
    this.userProfileRepo = AppDataSource.getRepository(UserProfile);
    this.userRepo = AppDataSource.getRepository(User);
  }
  
  async findAllByIdAndStatus(userId: string, status: FriendStatus): Promise<Friend[]> {
    return this.friendRepo
      .createQueryBuilder('friend')
      .where('(friend.requesterId = :userId OR friend.recipientId = :userId)', { userId })
      .andWhere('friend.status = :status', { status })
      .leftJoinAndSelect('friend.requester', 'requester')
      .leftJoinAndSelect('friend.recipient', 'recipient')
      .getMany();
  }

  /**
   * Encuentra todos los usuarios cuyo nombre contenga el string dado.
   */

  /**
   * Crea una nueva relación de amistad.
   */
  async createFriend(friendData:  Omit<Friend, 'id'>): Promise<Friend> {
    const friend = this.friendRepo.create(friendData);
    return await this.friendRepo.save(friend);
  }

  async getFriendById(friendId: string): Promise<Friend> {
    const friend = await this.friendRepo.findOneBy({ id: friendId });
    if (!friend) {
      throw new Error(`Friend with id ${friendId} not found`);
    }
    return friend;

  }	
  /**
   * Actualiza una relación de amistad.
   */
  async findAllUsersByName(nameData: string): Promise<User[]> {
    const users = await this.userRepo.createQueryBuilder('user')
      .where('user.profile.username LIKE :name', { username: `%${nameData}%` })
      .getMany();
    
      if (!users) {
        throw new Error(`There is not any user with the name ${nameData}`);
      }
    return users;
  }

  async updateFriendStatus(
    friendId: string,
    newStatus: FriendStatus
  ): Promise<Friend> {
    const friend = await this.getFriendById(friendId);
    friend.status = newStatus;
    return await this.friendRepo.save(friend);
  }

  /**
 * Busca si existe alguna relación de amistad entre dos usuarios, en cualquier estado 
 * y en cualquier dirección
 */
async findExistingFriendship(userId1: string, userId2: string): Promise<Friend | null> {
  return this.friendRepo
    .createQueryBuilder('friend')
    .where(
      '(friend.requesterId = :user1 AND friend.recipientId = :user2) OR ' +
      '(friend.requesterId = :user2 AND friend.recipientId = :user1)', 
      { user1: userId1, user2: userId2 }
    )
    .getOne();
}
}

