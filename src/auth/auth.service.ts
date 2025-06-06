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
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    private transporter = nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
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
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const user = await this.prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            emailverificationtoken: emailVerificationToken,
            emailverificationtokenexpiry: tokenExpiry,
            isemailverified: false,
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

        if (user.isemailverified) {
        return { message: 'Email already verified' };
        }

        if (
        user.emailverificationtoken !== token ||
        !user.emailverificationtokenexpiry ||
        user.emailverificationtokenexpiry < new Date()
        ) {
        throw new BadRequestException('Invalid or expired token');
        }

        await this.prisma.user.update({
        where: { email },
        data: {
            isemailverified: true,
            emailverificationtoken: null,
            emailverificationtokenexpiry: null,
        },
        });

        return { message: 'Email verified successfully' };
    }

    async signIn(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
        throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isemailverified) {
        throw new UnauthorizedException('Email not verified');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return { data:{accessToken},message:'Login Successful' };
    }
    }
