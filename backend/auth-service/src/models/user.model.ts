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
import { UserProfile } from '@backend/user-service/src/models/userProfile.model';
//TODO Aún está pendiente de hacer y corregir la importación
//import { Estadistics } from '@backend/user-service/src/models/userProfile.model';
//TODO Aún está pendiente de hacer y corregir la importación
//import { Map } from './Map';
//TODO Aún está pendiente de hacer y corregir la importación
//import { Plan } from './Plan';

/**
 * Rol posible para el usuario (ejemplo).
 * Ajusta si necesitas más roles.
 */
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
  
  /**
   * Relación inversa de 1:1 con UserProfile.
   * Como UserProfile es el dueño, aquí NO usamos @JoinColumn.
   */
  
  @OneToOne(() => UserProfile, (profile) => profile.id)
  profile?: UserProfile;

  /**
   * Relación 1:N con Map
   * "Map belongs to User" => en la entidad Map habrá un @ManyToOne(...).
   */
  // @OneToMany(() => Map, (map) => map.owner)
  // maps!: Map[];

  /**
   * Relación N:N (autorreferenciada) para "is friend of"
   * Un usuario puede tener muchos amigos (que también son usuarios).
   * Se usa un JoinTable para la tabla intermedia.
   */
  // @ManyToMany(() => User, (user) => user.friends)
  // @JoinTable({
  //   name: 'user_friends',
  //   joinColumn: {
  //     name: 'user_id',
  //     referencedColumnName: 'id',
  //   },
  //   inverseJoinColumn: {
  //     name: 'friend_id',
  //     referencedColumnName: 'id',
  //   },
  // })
  // friends!: User[];

  /**
   * Columnas de auditoría (fechas de creación y actualización).
   */
  // @CreateDateColumn()
  // createdAt!: Date;

  // @UpdateDateColumn()
  // updatedAt!: Date;
}