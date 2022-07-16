import { Api } from 'telegram'
import long = Api.long

export interface IActiveDirectoryUser {
    id: string,
    mail: string,
    givenName: string,
    surname: string,
    mobilePhone: string,
    businessPhones: string[],
    department: string
}

export interface ITelegramUser {
    id: long,
    phone: string,
    username: string
}