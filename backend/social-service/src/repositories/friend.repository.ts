import { Repository, Like} from 'typeorm';
import { Friend, FriendStatus, RequestType } from '../models/friend.model';
import { User } from '../../../auth-service/src/models/user.model';
import { AppDataSource } from '../../../database/appDataSource'; // Importa la instancia de conexión
import { UserProfile } from '../../../user-service/src/models/userProfile.model';

export default class FriendRepository {

  private friendRepo: Repository<Friend>;
  private userProfileRepo: Repository<UserProfile>;
  private userRepo: Repository<User>;

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
      .leftJoinAndSelect('recipient.profile', 'profileRecipient')
      .leftJoinAndSelect('requester.profile', 'profileRequester')
      .getMany();
  }

  /**
   * Crea una nueva relación de amistad.
   */
  async createFriend(friendData: Omit<Friend, 'id'>): Promise<Friend> {
    const friend = this.friendRepo.create(friendData);
    if (!friend) {
      throw new Error('Friend not created');
    }
    return await this.friendRepo.save(friend);
  }

  async getFriendById(friendId: string): Promise<Friend> {
    const friend = await this.friendRepo.findOneBy({ id: friendId });
    if (!friend) {
      throw new Error(`Friend with id ${friendId} not found`);
    }
    return friend;
  }
  async findAllUsersByName(nameData: string): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { profile: { username: Like(`${nameData}%`) } },
      relations: ['profile']
    });
  
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
   * y en cualquier dirección.
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

  /**
   * Obtiene los amigos (relaciones ACCEPTED) de un usuario.
   * Extrae el usuario opuesto en cada relación.
   */
  async getFriends(userId: string): Promise<User[]> {
    const acceptedRelations = await this.findAllByIdAndStatus(userId, FriendStatus.ACCEPTED);
    const friends = acceptedRelations.map(relation => {
      return relation.requester.id === userId ? relation.recipient : relation.requester;
    });
    return friends;
  }

  async getPendingRequestsForRecipient(userId: string): Promise<Friend[]> {
    return this.friendRepo
      .createQueryBuilder('friend')
      .where('friend.recipientId = :userId', { userId })
      .andWhere('friend.status = :status', { status: FriendStatus.PENDING })
      .leftJoinAndSelect('friend.requester', 'requester')
      .leftJoinAndSelect('requester.profile', 'profile')
      .leftJoinAndSelect('friend.map', 'map')
      .getMany();
  }

  async getInvitationsForMapByUser(userId: string): Promise<Friend[]> {
    return this.friendRepo
      .createQueryBuilder('friend')
      .where('friend.recipientId = :userId', { userId })
      .andWhere('friend.status = :status', { status: FriendStatus.PENDING })
      .andWhere('friend.requestType = :requestType', { requestType: RequestType.MAP })
      .leftJoinAndSelect('friend.requester', 'requester')
      .getMany();
  }

  async deleteFriendInvitation(friendId: string): Promise<void> {
    await this.friendRepo.createQueryBuilder()
      .delete()
      .from(Friend)
      .where("id = :friendId", { friendId })
      .execute();
  }
  

  
}
