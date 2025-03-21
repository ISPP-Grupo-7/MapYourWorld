import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    ManyToMany,
    JoinColumn,
    JoinTable,
    ManyToOne,
  } from 'typeorm';
  import { User } from '../../../auth-service/src/models/user.model';

  /**
   * Posibles estados de amistad.
   */
  export enum FriendStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    BLOCKED = 'BLOCKED',
    DELETED = 'DELETED',
  }
  
  @Entity('friend')
  export class Friend {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @ManyToOne(() => User, (user) => user.sentFriendRequests)
    requester!: User;
  
    @ManyToOne(() => User, (user) => user.receivedFriendRequests )
    recipient!: User;
  
    @Column({
      type: 'enum',
      enum: FriendStatus,
      default: FriendStatus.PENDING,
    })
    status!: FriendStatus;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  