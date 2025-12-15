import * as dotenv from 'dotenv';

dotenv.config();

import _ from 'lodash';
import publicIp from 'public-ip';
import axios from 'axios';
import Cloudflare from 'cloudflare'
import {RecordEditParams} from "cloudflare/src/resources/dns/records";

if (!process.env.CF_EMAIL || !process.env.CF_TOKEN) {
    console.log("No CF_EMAIL or CF_TOKEN set in process.env")
    // Sleep indefinitely
    while (true) {}
}

const cf: Cloudflare = new Cloudflare({
    apiEmail: process.env.CF_EMAIL,
    apiToken: process.env.CF_TOKEN,
})

async function main(): Promise<void> {
    const ip = await getGlobalIP()

    console.log(`Current IP Address: ${ip}`)

    const zones = await getZones()

    _.each(zones, async (zone) => {
        let dnsRecords = await getDNSRecords(zone.id)
        _.each(dnsRecords, (dnsRecord: Cloudflare.DNS.Records.Record) => {
            if (dnsRecord.type === 'A' && dnsRecord.content !== ip) {
                if (!dnsRecord.id) return;
                let updateRecord: RecordEditParams.ARecord = {
                    zone_id: zone.id,
                    name: dnsRecord.name,
                    type: 'A',
                    content: ip,
                }
                updateDNSRecord(dnsRecord.id, updateRecord)
                sendTelegramMessage(`Updating DNS record (${dnsRecord.name}) content to: ${ip}`);
                console.log(`Updating DNS record (${dnsRecord.name}) content to: ${ip}`)
            }
        })
    })
}

async function getGlobalIP(): Promise<string> {
    return publicIp.publicIpv4();
}

async function getZones() {
    const resp = await cf.zones.list()

    // @ts-ignore
    return resp.result
}

async function getDNSRecords(zoneId: string) {
    const resp = await cf.dns.records.list({zone_id: zoneId})

    // @ts-ignore
    return resp.result
}

async function updateDNSRecord(dnsRecordId: string, params: RecordEditParams) {
    const resp = await cf.dns.records.edit(dnsRecordId, params)

    // @ts-ignore
    return resp.result
}

function sendTelegramMessage(message: string) {
    return axios.post(`${process.env.TELEGRAM_BASE_URL}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${message}`);
}


main().then(() => setInterval(main, 5 * 1000))
