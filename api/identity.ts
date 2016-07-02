/// <reference path="typings/api.d.ts" />

import * as path from 'path';
import * as ds from 'nedb';
import * as sm from './store';
import * as Q from 'q';
import * as cm from './common';

export interface Identity {
    id: string,
    name: string,
    token?: string,
    credentials: { [credtype: string]: cm.IApiCredential };
}
    
export class IdentityService {
    constructor() {
        this._store = new sm.Store();
    }

    private _store: sm.Store;

    public async authenticate(credential: cm.IApiCredential): Promise<Identity> {
        var identity: Identity;

        if (!credential.credentialtype || !credential.data ) {
            throw new cm.BadRequest('Invalid credential');
        }

        // sample only supports UserPass cred
        if (credential.credentialtype !== "UserPass") {
            throw new cm.BadRequest('Unsupported credential type: ' + credential.credentialtype);
        }

        let username: string = credential.data["username"];
        var candidate: Identity = await this._store.findOne<Identity>({ "id": username });

        if (candidate) {
            let candidateCred: cm.IApiCredential = candidate.credentials[credential.credentialtype];

            if (candidateCred) {
                var password: string = credential.data["password"];

                var candPass: string = candidate.credentials[credential.credentialtype].data["password"];
                if (password === candPass) {
                    identity = candidate;
                }
            }

            // bad credentials isn't exceptional.
            // we successfully determined creds are bad.  identity is null in those cases.
        }
        
        return identity;
    }    

    public async initialize() {
        // insert some sample data for the demo

        await this._store.insert<Identity>(<Identity>{ 
            id: "johndoe",
            name: "John Doe", 
            credentials: {
                "UserPass": { 
                    credentialtype: "UserPass", 
                    data: {
                        "password": "password"
                    }
                }
            }
        });

        await this._store.insert<Identity>(<Identity>{ 
            id: "janedoe",
            name: "Jane Doe", 
            credentials: {
                "UserPass": { 
                    credentialtype: "UserPass", 
                    data: {
                        "password": "password"
                    }
                }
            }
        });
    }
}