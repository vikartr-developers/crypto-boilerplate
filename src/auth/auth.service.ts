    import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    } from '@nestjs/common';
    import * as bcrypt from 'bcryptjs';
    import { JwtService } from '@nestjs/jwt';
    import { v4 as uuidv4 } from 'uuid';
    import * as nodemailer from 'nodemailer';
    import { PrismaService } from 'src/prisma/prisma.service';

    @Injectable()
    export class AuthService {
      constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
      ) {}

      private readonly transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      async signUp(name: string, email: string, password: string) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });
        if (existingUser) {
          throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailVerificationToken = uuidv4();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await this.prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            emailVerificationToken: emailVerificationToken,
            emailVerificationTokenexpiry: tokenExpiry,
            isEmailVerified: false,
          },
        });

        const url = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&email=${email}`;
        await this.transporter.sendMail({
          to: email,
          subject: 'Verify your email',
          html: `<p>Hi ${name},</p>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${url}">${url}</a>
                <p>This link will expire in 24 hours.</p>`,
        });

        return { message: 'Signup successful! Please verify your email.' };
      }

      async verifyEmail(token: string, email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new BadRequestException('Invalid email');
        }

        if (user.isEmailVerified) {
          return { message: 'Email already verified' };
        }

        if (
          user.emailVerificationToken !== token ||
          !user.emailVerificationTokenexpiry ||
          user.emailVerificationTokenexpiry < new Date()
        ) {
          throw new BadRequestException('Invalid or expired token');
        }

        await this.prisma.user.update({
          where: { email },
          data: {
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationTokenexpiry: null,
          },
        });

        return { message: 'Email verified successfully' };
      }

      async signIn(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
          where: { email },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isEmailVerified) {
          throw new UnauthorizedException('Email not verified');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }

        const userRole = user.userRoles[0]?.role;

        const payload = {
          userId: user.id,
          email: user.email,
          roleId: userRole?.id,
          roleName: userRole?.name,
          permissions:
            userRole?.rolePermissions.map((rp) => ({
              permissionId: rp.permission.id,
              permissionName: rp.permission.name,
            })) || [],
        };

        const accessToken = this.jwtService.sign(payload);

        return {
          data: { accessToken },
          message: 'Login Successful',
        };
      }
    }
