import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId?: number): Promise<Task | null> {
    if (!createTaskDto || !createTaskDto.title) {
      throw new BadRequestException('Title is required');
    }

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description || '',
      completed: typeof createTaskDto.completed === 'boolean' ? createTaskDto.completed : false,
      status: createTaskDto.status || 'new',
      category: createTaskDto.category || 'work',
      assignedTo: createTaskDto.assignedTo || undefined,
      organizationId: createTaskDto.organizationId || 1,
      createdBy: userId || createTaskDto.createdBy || 1,
    });
    
    const savedTask = await this.tasksRepository.save(task);
    
    // Log the task creation
    if (userId) {
      try {
        await this.auditLogsService.logTaskAction(
          AuditAction.CREATE,
          savedTask.id,
          userId,
          savedTask.organizationId,
          `Task "${savedTask.title}" created`,
          { task: savedTask }
        );
      } catch (error) {
        // Don't fail the task creation if logging fails
        console.error('Failed to log task creation:', error);
      }
    }
    
    // Return the task with user information
    const taskWithUsers = await this.findOne(savedTask.id);
    if (!taskWithUsers) {
      throw new Error('Failed to retrieve created task with user information');
    }
    return taskWithUsers;
  }

  async findAll(): Promise<Task[]> {
    return await this.tasksRepository.find({
      relations: ['creator', 'assignee'],
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        status: true,
        category: true,
        createdBy: true,
        assignedTo: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true
        },
        assignee: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true
        }
      }
    });
  }

  async findOne(id: number): Promise<Task | null> {
    return await this.tasksRepository.findOne({ 
      where: { id },
      relations: ['creator', 'assignee'],
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        status: true,
        category: true,
        createdBy: true,
        assignedTo: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true
        },
        assignee: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true
        }
      }
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId?: number): Promise<Task | null> {
    if (!updateTaskDto || Object.keys(updateTaskDto).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    // Get the current task to log changes
    const currentTask = await this.findOne(id);
    if (!currentTask) {
      throw new BadRequestException('Task not found');
    }

    await this.tasksRepository.update(id, updateTaskDto);
    const updatedTask = await this.findOne(id);

    // Log the task update
    if (userId && updatedTask) {
      try {
        const changes = {
          before: currentTask,
          after: updatedTask,
          updatedFields: Object.keys(updateTaskDto)
        };

        await this.auditLogsService.logTaskAction(
          AuditAction.UPDATE,
          id,
          userId,
          updatedTask.organizationId,
          `Task "${updatedTask.title}" updated`,
          changes
        );
      } catch (error) {
        // Don't fail the task update if logging fails
        console.error('Failed to log task update:', error);
      }
    }

    return updatedTask;
  }

  async remove(id: number, userId?: number): Promise<boolean> {
    // Get the task before deletion to log it
    const taskToDelete = await this.findOne(id);
    if (!taskToDelete) {
      throw new BadRequestException('Task not found');
    }

    const result = await this.tasksRepository.delete(id);
    const deleted = result.affected ? result.affected > 0 : false;

    // Log the task deletion
    if (deleted && userId) {
      try {
        await this.auditLogsService.logTaskAction(
          AuditAction.DELETE,
          id,
          userId,
          taskToDelete.organizationId,
          `Task "${taskToDelete.title}" deleted`,
          { deletedTask: taskToDelete }
        );
      } catch (error) {
        // Don't fail the task deletion if logging fails
        console.error('Failed to log task deletion:', error);
      }
    }

    return deleted;
  }
}
