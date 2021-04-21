import * as dotenv from 'dotenv';

dotenv.config();

import * as _ from 'lodash'
import * as publicIp from 'public-ip'
import Cloudflare from 'cloudflare'

const cf: Cloudflare = new Cloudflare({token: process.env.CF_TOKEN})

async function main(): Promise<void> {
    const ip = await getGlobalIP()

    console.log(`Current IP Address: ${ip}`)

    const zones = await getZones()

    _.each(zones, async (zone) => {
        let dnsRecords = await getDNSRecords(zone.id)

        _.each(dnsRecords, (dnsRecord) => {
            if (dnsRecord.content !== ip) {
                dnsRecord.content = ip
                // updateDNSRecord(zone.id, dnsRecord.id, dnsRecord)
                console.log(`Updating DNS record (${dnsRecord.name}) content to: ${ip}`)
            }
        })
    })
}

async function getGlobalIP(): Promise<string> {
    return publicIp.v4();
}

async function getZones() {
    const resp = await cf.zones.browse()

    // @ts-ignore
    return resp.result
}

async function getDNSRecords(zoneId: string) {
    const resp = await cf.dnsRecords.browse(zoneId)

    // @ts-ignore
    return resp.result
}

async function updateDNSRecord(zoneId: string, dnsRecordId: string, record: { type: Cloudflare.RecordTypes; name: string; content: string; ttl: number; proxied?: boolean | undefined; }) {
    const resp = await cf.dnsRecords.edit(zoneId, dnsRecordId, record)

    // @ts-ignore
    return resp.result
}

main().then(() => setInterval(main, 5 * 1000))

