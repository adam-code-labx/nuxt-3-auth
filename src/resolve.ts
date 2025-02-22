import type { Strategy, ModuleOptions } from './types';
import type { Nuxt, NuxtModule } from '@nuxt/schema'
import { resolvePath, installModule } from '@nuxt/kit';
import { ProviderAliases } from './providers';
import * as AUTH_PROVIDERS from './providers';
import { existsSync } from 'fs';
import { hash } from 'ohash'

const BuiltinSchemes = {
    local: 'LocalScheme',
    cookie: 'CookieScheme',
    oauth2: 'Oauth2Scheme',
    openIDConnect: 'OpenIDConnectScheme',
    refresh: 'RefreshScheme',
    laravelJWT: 'LaravelJWTScheme',
    laravelSanctum: 'LaravelSanctumScheme',
    auth0: 'Auth0Scheme',
};

export interface ImportOptions {
    name: string;
    as: string;
    from: string;
}

export async function resolveStrategies(nuxt: Nuxt, options: ModuleOptions): Promise<{ strategies: Strategy[]; strategyScheme: Record<string, ImportOptions>; }> {
    const strategies: Strategy[] = [];
    const strategyScheme = {} as Record<string, ImportOptions>;

    for (const name of Object.keys(options.strategies!)) {
        if (!options.strategies![name] || (options.strategies as Strategy)[name].enabled === false) {
            continue;
        }

        // Clone strategy
        const strategy = Object.assign({}, options.strategies![name]) as Strategy;

        // Default name
        if (!strategy.name) {
            strategy.name = name;
        }

        // Default provider (same as name)
        if (!strategy.provider) {
            strategy.provider = strategy.name;
        }

        // Try to resolve provider
        const provider = await resolveProvider(strategy.provider);

        delete strategy.provider;

        if (typeof provider === 'function' && !(provider as NuxtModule).getOptions) {
            provider(nuxt, strategy);
        }

        // Default scheme (same as name)
        if (!strategy.scheme) {
            strategy.scheme = strategy.name;
        }

        try {
            // Resolve and keep scheme needed for strategy
            const schemeImport = await resolveScheme(strategy.scheme);
            delete strategy.scheme;
            strategyScheme[strategy.name] = schemeImport as ImportOptions;

            // Add strategy to array
            strategies.push(strategy);
        } catch (e) {
            console.error(`[Auth] Error resolving strategy ${strategy.name}: ${e}`);
        }
    }

    return {
        strategies,
        strategyScheme,
    };
}

export async function resolveScheme(scheme: string): Promise<ImportOptions | void> {
    if (typeof scheme !== 'string') {
        return;
    }

    if (BuiltinSchemes[scheme as keyof typeof BuiltinSchemes]) {
        return {
            name: BuiltinSchemes[scheme as keyof typeof BuiltinSchemes],
            as: BuiltinSchemes[scheme as keyof typeof BuiltinSchemes],
            from: '#auth/runtime',
        };
    }

    const path = await resolvePath(scheme);

    if (existsSync(path)) {
        const _path = path.replace(/\\/g, '/');
        return {
            name: 'default',
            as: 'Scheme$' + hash({ path: _path }),
            from: _path,
        };
    }
}

export async function resolveProvider(provider: string | ((...args: any[]) => any)) {
    if (typeof provider === 'function') {
        return provider;
    }

    if (typeof provider !== 'string') {
        return;
    }

    provider = (ProviderAliases[provider as keyof typeof ProviderAliases] || provider);

    if (AUTH_PROVIDERS[provider as keyof typeof AUTH_PROVIDERS]) {
        return AUTH_PROVIDERS[provider as keyof typeof AUTH_PROVIDERS];
    }

    try {
        const m = await installModule(provider);
        return m;
    } catch (e) {
        return;
    }
}
