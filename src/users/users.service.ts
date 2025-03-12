import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Plan, UserRole, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName, role, orgName, plan, ownerId } = createUserDto;

    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Start a transaction to create user and assign roles
      return await this.prisma.$transaction(async (prisma) => {
        // Create the user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            orgName,
            plan: plan || Plan.STARTER, // Default plan
            ownerId,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            orgName: true,
            plan: true,
            ownerId: true,
            createdAt: true,
          },
        });

        // Assign default role based on user's role
        let defaultRoleName = 'Member';
        if (role === 'ADMIN') defaultRoleName = 'Admin';
        if (role === 'OWNER') defaultRoleName = 'Owner';
        if (role === 'SUPER') defaultRoleName = 'Super Admin';
        if (role === 'SUPPORT') defaultRoleName = 'Support';

        const defaultRole = await prisma.role.findUnique({
          where: { name: defaultRoleName },
        });

        if (defaultRole) {
          await prisma.userRoleAssignment.create({
            data: {
              userId: user.id,
              roleId: defaultRole.id,
            },
          });
        }

        // Create default workspace if user is an owner
        if (role === 'OWNER' && orgName) {
          const workspace = await prisma.workspace.create({
            data: {
              name: `${orgName} Workspace`,
              ownerId: user.id,
            },
          });

          // Add user to workspace
          await prisma.userWorkspace.create({
            data: {
              userId: user.id,
              workspaceId: workspace.id,
              role: WorkspaceRole.ADMIN,
            },
          });
        }

        return user;
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new BadRequestException('Could not create user');
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        orgName: true,
        plan: true,
        ownerId: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        orgName: true,
        plan: true,
        ownerId: true,
        createdAt: true,
        userWorkspaces: {
          include: {
            workspace: true,
          },
        },
        userRoleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prepare update data
    const updateData: any = { ...rest };

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          orgName: true,
          plan: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      throw new BadRequestException('Could not update user');
    }
  }

  async remove(id: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });

      return { message: `User with ID ${id} deleted successfully` };
    } catch (error) {
      throw new BadRequestException('Could not delete user');
    }
  }
}
