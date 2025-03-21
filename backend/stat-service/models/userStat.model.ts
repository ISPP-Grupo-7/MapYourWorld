import {
    Entity,
    PrimaryGeneratedColumn,
    Column
  } from 'typeorm';
  
  @Entity('user_stats')
  export class UserStat {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: false })
    userId!: string;
  
    @Column({ type: 'int', default: 0 })
    totalPoisCreados!: number;
  
    @Column({ type: 'int', default: 0 })
    totalAmigos!: number;
  
    @Column({ type: 'int', default: 0 })
    totalAchievements!: number;
  
    @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
    distanceCumulative!: number;
  
    @Column({ type: 'int', default: 0 })
    daysConsecutive!: number;
  
    @Column({ type: 'int', default: 0 })
    rankingPoints!: number;
  }