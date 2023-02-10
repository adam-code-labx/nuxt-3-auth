import type { ProviderPartialOptions, HTTPRequest, ProviderOptions } from '../types';
import type { CookieSchemeOptions } from '../runtime';
import type { Nuxt } from '@nuxt/schema'
import { assignAbsoluteEndpoints, assignDefaults } from '../utils/provider';

export interface LaravelSanctumProviderOptions extends ProviderOptions, CookieSchemeOptions {}

export function laravelSanctum(nuxt: Nuxt, strategy: ProviderPartialOptions<LaravelSanctumProviderOptions>): void {
    const endpointDefaults: Partial<HTTPRequest> = {
        credentials: 'include'
    };

    const DEFAULTS: typeof strategy = {
        scheme: 'laravelSanctum',
        name: 'laravelSanctum',
        cookie: {
            name: 'XSRF-TOKEN',
            server: nuxt.options.ssr
        },
        endpoints: {
            csrf: {
                ...endpointDefaults,
                url: '/sanctum/csrf-cookie',
            },
            login: {
                ...endpointDefaults,
                url: '/login',
            },
            logout: {
                ...endpointDefaults,
                url: '/logout',
            },
            user: {
                ...endpointDefaults,
                url: '/api/user',
            },
        },
        user: {
            property: {
                server: false,
                client: false
            },
            autoFetch: false,
        }
    };

    assignDefaults(strategy, DEFAULTS)

    if (strategy.url) {
        assignAbsoluteEndpoints(strategy)
    }
}
