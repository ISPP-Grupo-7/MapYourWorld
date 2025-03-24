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
    Unique,
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

  export enum RequestType{
    MAP = 'MAP',
    FRIEND = 'FRIEND'
  }
  
  @Entity('friend')
  @Unique(['requester', 'recipient', 'requestType'])
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
  