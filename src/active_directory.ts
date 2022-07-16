import qs from 'qs';
import rp from 'request-promise';
import dotenv from 'dotenv'
import _ from 'lodash'
import { logger } from './logger';
import 'isomorphic-fetch'
dotenv.config();

const appID: string = String(process.env.CLIENT_ID);
const graphScope: string = String(process.env.SCOPE);
const clientSecret: string = String(process.env.CLIENT_SECRET);
const tokenEndPoint: string = String(process.env.TOKEN_ENDPOINT);


async function getClientCredentials (appID: string, graphScope: string, clientSecret: string, tokenEndPoint: string) {
    const postData: {} = {
        client_id: appID,
        scope: graphScope,
        client_secret: clientSecret,
        resource: 'https://graph.microsoft.com',
        grant_type: 'client_credentials'
    };
    const options = {
        method: 'POST',
        uri: tokenEndPoint,
        form: qs.stringify(postData),
        headers: {
            'content-type': 'application/x-www-form-urlencoded' // Is set automatically
        }
    };
    try {
        if (!!appID && !!graphScope && !!clientSecret && !!tokenEndPoint) {
            const result = await rp(options);
            return JSON.parse(result);
        } else {
            logger.error('invalid parameters for function');
        }
    } catch (e) {
        throw e;
    }
}

export async function getAccessToken (): Promise<string> {
    try {
        const accessToken = await getClientCredentials(appID, graphScope, clientSecret, tokenEndPoint);
        return accessToken.access_token;
    } catch (e) {
        throw e;
    }
}
