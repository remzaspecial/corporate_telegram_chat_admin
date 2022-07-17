import { Api, TelegramClient} from 'telegram';
import { StringSession } from 'telegram/sessions';
import { IActiveDirectoryUser } from './interfaces';
import { generateRandomBytes, readBigIntFromBuffer } from 'telegram/Helpers';


const stringSession: StringSession = new StringSession(String(process.env.SESSION!));
const apiId: number = Number(process.env.API_ID);
const apiHash: string = String(process.env.API_HASH);
//channelId is telegram ID to your corporate channel
const channelId: string = String(process.env.CHANNEL_ID!);

const client = new TelegramClient(stringSession, apiId, apiHash, {});

export async function saveContactGetId (user: IActiveDirectoryUser): Promise<Api.long> {
    try {
        let userNumber = ''
        if(!user.mobilePhone) userNumber = user.businessPhones[0];
        else userNumber = user.mobilePhone;
        const userEntity: Api.contacts.ImportedContacts = await client.invoke(
            new Api.contacts.ImportContacts({
                contacts: [
                    new Api.InputPhoneContact({
                        clientId: readBigIntFromBuffer(generateRandomBytes(8)),
                        phone: userNumber, 
                        firstName: user.givenName,
                        lastName: user.surname
                    })
                ]
            })
        );
        return userEntity.users[0].id;
    } catch (e) {
        throw e
    }
}

export async function addUser (user: IActiveDirectoryUser): Promise<Api.TypeUpdates> {
    try {
        const userId: Api.long = await saveContactGetId(user);
        const entity = await client.getEntity(userId);
        const inputEntity = await client.getInputEntity(entity);
        const channelEntity = await client.getEntity(channelId);

        const result = await client.invoke(
            new Api.channels.InviteToChannel({
                channel: channelEntity,
                users: [inputEntity]
            })
        );
        return result; // prints the result
    } catch (e) {
        throw e
    }
}
