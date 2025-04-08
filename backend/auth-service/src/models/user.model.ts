import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { UserProfile } from "../../../user-service/src/models/userProfile.model";
import { Friend } from "../../../social-service/src/models/friend.model"
//TODO Aún está pendiente de hacer y corregir la importación
//TODO Aún está pendiente de hacer y corregir la importación
import { Map } from '../../../map-service/src/models/map.model';
import { Subscription } from '../../../payment-service/models/subscription.model';
import { UserDistrict } from '../../../map-service/src/models/user-district.model';
//TODO Aún está pendiente de hacer y corregir la importación
//import { Plan } from './Plan';


export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'boolean', default: false })
  is_active!: boolean;

  @Column({ type: 'varchar', length: 700, nullable: true })
  token_data?: string;
  /**
   * Relación inversa de 1:1 con UserProfile.
   * Como UserProfile es el dueño, aquí NO usamos @JoinColumn.
   */

  @OneToOne(() => UserProfile, { eager: true })
  @JoinColumn()
  profile!: UserProfile;

  /**
   * Relación 1:N con solicitudes de amistad enviadas.
   */
  @OneToMany(() => Friend, (friend) => friend.requester)
  sentFriendRequests!: Friend[];

  /**
   * Relación 1:N con solicitudes de amistad recibidas.
   */
  @OneToMany(() => Friend, (friend) => friend.recipient)
  receivedFriendRequests!: Friend[];
  /**
   * Relación 1:N con Map
   * "Map belongs to User" => en la entidad Map habrá un @ManyToOne(...).
   */
  @ManyToMany(() => Map, (map) => map.users_joined, { eager: true , cascade: ['remove'], onDelete: 'CASCADE'})
  @JoinTable({
    name: 'user_maps_joined',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'map_id',
      referencedColumnName: 'id',
    },
  })
  maps_joined!: Map[];

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription!: Subscription;

  @OneToMany(() => UserDistrict, (userDistrict) => userDistrict.user)
  userDistrict!: UserDistrict[];
}