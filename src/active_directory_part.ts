import qs from 'qs';
import rp from 'request-promise';
import dotenv from 'dotenv'
import _ from 'lodash'
import fs from 'fs';
import * as graph from '@microsoft/microsoft-graph-client';
import { logger } from './logger';
import { IActiveDirectoryUser } from './interfaces';
import { AuthProviderCallback } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'
import { addUser } from './telegram_user_api_part';
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

export async function getUsersDataFromAd (): Promise<IActiveDirectoryUser[]> {
    const betweenResult: any = [];
    let result: IActiveDirectoryUser[] = [];
    const accessToken = await getAccessToken();
    const clientAd: graph.Client = graph.Client.init({
        // Use the provided access token to authenticate
        // requests
        authProvider: async (done: AuthProviderCallback) => {
            done(null, accessToken);
        }
    });
    // If your company has more than 100 emplpoyees, MS Graph uses @odata.nextLink to separate them on different pages
    try {
        let link = '/users?$select=id,mail,givenName,surname,mobilePhone,businessPhones,department';
        while (true) {
            const response = await clientAd.api(link)
                .get();
            link = response['@odata.nextLink'];
            betweenResult.push(response.value);
            if (!link) {
                break;
            }
        }
        return _.flatten(betweenResult) as IActiveDirectoryUser[];
    } catch (e) {
        throw e;
    }
}

export async function activeDirectoryFindNew (): Promise<void> {
    // FILE_NAME is name of file with current users list
    const fileName: string = process.env.FILE_NAME!;
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, JSON.stringify(await getUsersDataFromAd(), null, 2));
        return;
    }
    try {
        const firstTry: IActiveDirectoryUser[] = JSON.parse(fs.readFileSync(fileName).toString()) as IActiveDirectoryUser[];
        const secondTry: IActiveDirectoryUser[] = await getUsersDataFromAd();
        const newUsers = _.filter(secondTry, stItem => {
            let found = false;
            _.each(firstTry, ftItem => {
                if (stItem.id === ftItem.id) found = true;
            });
            return !found;
        });
        // When there is new user, program adds him to a corporate channel
        _.each(newUsers, async (user) => {
            logger.info('program found new user' + JSON.stringify(user));
            try {
                await addUser(user)
            } catch (e) {
                logger.error(e);
            }
        });
        fs.writeFileSync(fileName, JSON.stringify(secondTry, null, 2));
    } catch (e) {
        logger.error(e);
    }
}