import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
    canActivate(context: ExecutionContext) {
        console.log('Inside JwtAuthGuard');
        return super.canActivate(context);
    }
}