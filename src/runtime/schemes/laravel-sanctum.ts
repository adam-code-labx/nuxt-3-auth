import type { HTTPResponse, TokenableScheme, TokenableSchemeOptions } from '../../types';
import { Token, RequestHandler } from '../inc';
import { CookieScheme } from './cookie';

export class LaravelSanctumScheme extends CookieScheme<any>
{
    token: Token;

    constructor($auth: any, options: any, defaults: any) {
        super($auth, options, defaults);
        this.requestHandler.http.setHeader('Content-Type', 'application/json');
        this.requestHandler.http.setHeader('Accept', 'application/json');

        this.token = new Token(this, this.$auth.$storage);
    }

    setUserToken(token: string): Promise<HTTPResponse | void> {
        this.token.set(token);

        // Fetch user
        return this.fetchUser();
    }
}
