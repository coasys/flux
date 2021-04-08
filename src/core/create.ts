import Perspective from "ad4m/Perspective";
import { v4 as uuidv4 } from 'uuid';
import {default as SharedPerspective, SharingType} from "ad4m/SharedPerspective";
import type Agent from "ad4m/Agent";
import client from "./init";
import ADD_PERSPECTIVE from "./graphql_queries";
import { gql, useMutation } from '@apollo/client';

const [addPerspective, { data }] = useMutation(ADD_PERSPECTIVE);

/// Returns URL of sharedperspective and seed for decrypting given shared perspective
export async function createGroup(name: string): Promise<[string, string]> {
    let perspective = await addPerspective({variables: {name: name}}).then(result => {
        console.log("executed perspective mutation with result", result);
        let perspective = new Perspective();
        let data = result.data;
        perspective.name = data?.name;
        perspective.uuid = data?.uuid;
        perspective.author = data?.author;
        perspective.timestamp = data?.timestamp;
        perspective.linksSharingLanguage = data?.linksSharingLanguage;
        return perspective
    })
    return ["langlang://hash", "seed"]
}

async function createSharedPerspective(name: string): Promise<[SharedPerspective, string]> {
    const sharedPerspective = new SharedPerspective(name, "", SharingType.Holochain);
    //For now use uuid as seed; in the future use more user friendly seed 
    let seed = uuidv4();

    const hcTemplateFilePath = path.join(process.env.PWD, templates.holochain)
    const hcDnaPath = path.join(process.env.PWD, "./src/languages/social-context/social-context.dna.gz")

    return [sharedPerspective, seed]
}

async function createUniqueHcLanguage(dnaPath: string, bundlePath) {

}

//Flow to be implemented:
// - gql: add perspective
// - init shared perspective
// - duplicate social context & expr dna's w/ dna prop insert
// - use language of languages to upload to IPFS
//     - gql: getLang(hashoflanglang)
// - Install language using language controller
//     - blocked: need gql interface for installLanguage() on AD4M 
// - add language of languages URL's to shared perspective
// - use perspective persistence language to publish shared perspective
//     - gql: getLang(hashofpersistencelang)
// - update original perspective w/new shared perspective stuff