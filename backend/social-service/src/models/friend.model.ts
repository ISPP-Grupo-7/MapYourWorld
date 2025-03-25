import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../../auth-service/src/models/user.model';
import { Map } from '../../../map-service/src/models/map.model';

/**
 * Posibles estados de amistad.
 */
export enum FriendStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export enum RequestType {
  MAP = 'MAP',
  FRIEND = 'FRIEND'
}

@Entity('friend')
@Index('UQ_friend_request', ['requester', 'recipient'], { unique: true, where: `"requestType" = 'FRIEND'` })
@Index('UQ_map_invitation', ['requester', 'recipient', 'map'], { unique: true, where: `"requestType" = 'MAP'` })
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.sentFriendRequests)
  requester!: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests)
  recipient!: User;

  @Column({
    type: 'enum',
    enum: FriendStatus,
    default: FriendStatus.PENDING,
  })
  status!: FriendStatus;

  @Column({
    type: 'enum',
    enum: RequestType,
    default: RequestType.FRIEND,
  })
  requestType!: RequestType;

  @ManyToOne(() => Map, (map) => map, { nullable: true })
  @JoinColumn({ name: 'mapId' })
  map!: Map;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
