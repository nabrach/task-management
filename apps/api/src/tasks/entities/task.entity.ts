import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'work' })
  category: string;

  @Column({ type: 'int', name: 'created_by', nullable: true, default: 1 })
  createdBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'int', nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column({ type: 'int', name: 'organization_id', nullable: true, default: 1 })
  organizationId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
