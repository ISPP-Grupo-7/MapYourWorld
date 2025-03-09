import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
  } from 'typeorm';
  import { User } from '@backend/auth-service/src/models/user.model';
  
  @Entity('user_profiles')
  export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ unique: true })
    username!: string;
  
    @Column()
    firstName!: string;
  
    @Column()
    lastName!: string;
  
    @Column({ nullable: true })
    picture?: string;
  
    // @OneToOne(() => User, (user) => user.profile)
    // user!: User;
  }
  