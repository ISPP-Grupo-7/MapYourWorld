import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Campo para asociar el perfil con el ID del usuario en auth-service
    @Column({ unique: true })
    userId!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: true })
    firstName!: string;

    @Column({ nullable: true })
    lastName!: string;

    @Column({ type: 'text', nullable: true })
    bio!: string;

    @Column({ nullable: true })
    avatar!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ type: 'jsonb', nullable: true })
    location!: {
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };

    @Column({ type: 'jsonb', nullable: true })
    social!: {
        instagram?: string;
        twitter?: string;
        facebook?: string;
    };

    @Column({ 
        type: 'jsonb', 
        default: {
            language: 'es',
            theme: 'light',
            notificationsEnabled: true,
            privacySettings: {
                showLocation: true,
                showActivity: true,
                profileVisibility: 'public'
            }
        }
    })
    preferences!: {
        language: string;
        theme: 'light' | 'dark' | 'system';
        notificationsEnabled: boolean;
        privacySettings: {
            showLocation: boolean;
            showActivity: boolean;
            profileVisibility: 'public' | 'followers' | 'private';
        };
    };

    @Column({ 
        type: 'jsonb', 
        default: {
            totalPoints: 0,
            level: 1,
            districtsUnlocked: 0,
            poisVisited: 0,
            photosUploaded: 0,
            achievements: 0,
            followers: 0,
            following: 0
        }
    })
    statistics!: {
        totalPoints: number;
        level: number;
        districtsUnlocked: number;
        poisVisited: number;
        photosUploaded: number;
        achievements: number;
        followers: number;
        following: number;
    };

    @Column({ 
        type: 'enum', 
        enum: ['active', 'suspended', 'deactivated'], 
        default: 'active' 
    })
    accountStatus!: 'active' | 'suspended' | 'deactivated';

    @Column({ type: 'timestamp', nullable: true })
    lastActive!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
