import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { envConfig } from "../../config/env.config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        console.log('JWT Strategy constructor - JWT_SECRET:', envConfig.JWT_SECRET);
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: envConfig.JWT_SECRET,
        });
    }

    async validate(payload: any) {
        console.log('Inside JwtStrategy validate method');
        console.log('JWT Strategy - Full payload:', payload);
        console.log('JWT Strategy - payload.user:', payload.user);
        console.log('JWT Strategy - payload.user.organizationId:', payload.user?.organizationId);
        console.log('JWT Strategy - payload.user keys:', Object.keys(payload.user || {}));
        
        // Return just the user data, not wrapped in an object
        return payload.user;
    }
}