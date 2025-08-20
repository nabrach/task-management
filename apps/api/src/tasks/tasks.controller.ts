import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Put, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  private readonly logger = new Logger(TasksController.name);
  
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req): Promise<Task> {
    this.logger.log(`Received create request: ${JSON.stringify(createTaskDto)}`);
    
    if (!createTaskDto) {
      this.logger.error('createTaskDto is undefined');
      throw new Error('Request body is missing');
    }
    
    const task = await this.tasksService.create(createTaskDto, req.user.id);
    if (!task) {
      throw new Error('Failed to create task');
    }
    
    return task;
  }

  @Get()
  async findAll(): Promise<Task[]> {
    return await this.tasksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Task | null> {
    return await this.tasksService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req): Promise<Task | null> {
    this.logger.log(`Received update request for id ${id}: ${JSON.stringify(updateTaskDto)}`);
    this.logger.log(`UpdateTaskDto type: ${typeof updateTaskDto}, keys: ${Object.keys(updateTaskDto || {})}`);
    
    // Log each field individually
    if (updateTaskDto) {
      Object.entries(updateTaskDto).forEach(([key, value]) => {
        this.logger.log(`Field ${key}: ${value} (type: ${typeof value})`);
      });
    }
    
    return await this.tasksService.update(+id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<boolean> {
    return await this.tasksService.remove(+id, req.user.id);
  }
}
