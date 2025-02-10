import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import * as crypto from 'crypto';
import axios from "axios";
import * as secp256k1 from "secp256k1"; //"secp256k1": "^5.0.0",
import { encode, RecordView } from "@planetarium/bencodex"; //"@planetarium/bencodex": "^0.2.2",
import { ethers } from "ethers"; //"ethers": "^5.5.1";
import {NodeHealthService} from "./db/node-health/node-health.service";
import * as https from "node:https";
import * as http from "node:http";


@Injectable()
export class ApiService {
    private endPointListURL = "https://planets.nine-chronicles.com/planets/";
    private readonly logger = new Logger(ApiService.name);
    private accounts;
    private instanceForSend;
    private instanceForCheck;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly nodeHealthService: NodeHealthService
    ) {
        this.instanceForSend = axios.create({
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true }),
            timeout: 20000,  // ✅ timeout 증가 (기존 5000ms → 20000ms)
        });

        this.instanceForCheck = axios.create({
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true }),
            timeout: 25000,  // ✅ timeout 증가 (기존 20000ms → 25000ms)
        });
        this.accounts = [
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_0'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_0'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_1'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_1'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_2'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_2'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_3'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_3'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_4'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_4'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_5'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_5'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_6'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_6'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_7'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_7'),
            },
            {
                privateKey: this.configService.get<string>('PRIVATE_KEY_8'),
                address: this.configService.get<string>('ACCOUNT_ADDRESS_8'),
            }
        ];
    }

    public async getRPCEndPoints() {
    console.log(`🚀 getRPCEndPoints() 실행!`);
    
    try {
        const { data } = await firstValueFrom(
            this.httpService.get(this.endPointListURL).pipe(
                catchError((error: AxiosError) => {
                    console.log('❌ RPC 엔드포인트 요청 실패:', error.message);
                    throw new Error('RPC 엔드포인트 조회 중 오류 발생.');
                }),
            ),
        );

        if (!data || data.length < 2) {
            throw new Error('🚨 RPC 엔드포인트 데이터가 올바르지 않습니다.');
        }

        console.log(`✅ RPC 엔드포인트 가져옴!`, data);
        return [data[0].rpcEndpoints['headless.gql'], data[1].rpcEndpoints['headless.gql']];
    } catch (error) {
        console.error(`❌ getRPCEndPoints() 실행 중 오류 발생:`, error.message);
        throw error;
    }
}


    public async send(groupName: string, rpcEndpoints: string[], timeStamp: Date) {
    console.log(`🔥 send() 실행됨! groupName: ${groupName}, endpoints: ${rpcEndpoints.length}`);
    console.log('🛠️ this.accounts 확인:', this.accounts);

    const uniqueTxs = new Set();

    for (let i = 0; i < rpcEndpoints.length; i++) {
        if (i >= this.accounts.length) continue;

        const sender = this.accounts[i].address;
        const recipient = this.accounts[(i + 1) % this.accounts.length].address;

        if (uniqueTxs.has(`${sender}-${recipient}`)) {
            console.warn(`⚠️ 중복 방지: 이미 실행된 트랜잭션! Sender: ${sender}, Recipient: ${recipient}`);
            continue;
        }

        uniqueTxs.add(`${sender}-${recipient}`);
        let action = groupName === 'odin'
            ? this.makeTransferInOdin(sender, recipient)
            : this.makeTransferInHeimdall(sender, recipient);

        try {
            const txHash = await this.sendTx(rpcEndpoints[i], action, this.accounts[i]);
            console.log(`✅ 트랜잭션 성공! Endpoint: ${rpcEndpoints[i]}, TxHash: ${txHash}`);

            await this.nodeHealthService.updateTempTx(rpcEndpoints[i], txHash, timeStamp);
            
            // ✅ 트랜잭션 간 실행 간격을 둠 (2초 대기)
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`❌ 트랜잭션 실패! Endpoint: ${rpcEndpoints[i]}, Error:`, error.message);

            const failedTxHash = "FAILED_TX_HASH";  // 🚨 임시 기본값 설정
            console.log("🧐 updateFailedTempTx() 실행됨. 저장할 데이터:", {
                groupName,
                endpoint: rpcEndpoints[i],
                timestamp: timeStamp,
                txHash: failedTxHash,
            });

            await this.nodeHealthService.updateFailedTempTx(rpcEndpoints[i], failedTxHash, timeStamp);
            
            // ✅ 오류 발생 시 5초 대기 후 다음 트랜잭션 실행 (재시도 간격 추가)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

    public async saveTemp(groupName: string, rpcEndpoints: string[], timeStamp: Date) {
        for (let i = 0; i < rpcEndpoints.length; i++) {
            if(i >= this.accounts.length) //만약 엔드포인트가 훨씬 더 늘어났을 경우 계정 생성 바람.
                break;
            await this.nodeHealthService.saveTempTx(groupName, rpcEndpoints[i], timeStamp);
        }
    }

    public async findAllLostMinute(groupedData: { [key: string]: any[] }) {
        const commonTimestamps = [];
        // groupedData에서 각 URL과 해당 타임스탬프를 Set에 저장
        for (const [endpoint_url, data] of Object.entries(groupedData)) {
            data.forEach(item => commonTimestamps.push({endpoint_url: endpoint_url, timestamp: new Date(item.timeStamp).toISOString()}));
        }
        console.log(commonTimestamps);
        return commonTimestamps;
    }


    public async groupingLostRequestDetail(groupedData: { [key: string]: any[] }) {
        const missingNodesByEndpoint: { [key: string]: any[] } = {};

        for (const [endpoint_url, data] of Object.entries(groupedData)) {
            const missingNodes: string[] = [];

            data.forEach(item => {
                const timestamp = item.timeStamp.toISOString();
                missingNodes.push(timestamp.split(':')[0] + ':' + timestamp.split(':')[1]);
            });
            if (missingNodes.length > 0) {
                missingNodesByEndpoint[endpoint_url] = missingNodes; // 누락된 노드를 저장
            }
            else
                missingNodesByEndpoint[endpoint_url] = [];
        }
        return missingNodesByEndpoint;
    }

    private makeTransferInOdin(sender: string, recipient: string) {
        return Buffer.from(encode(new RecordView({
            type_id: 'transfer_asset5',
            values: {
                amount: [
                    new RecordView(
                        {
                            decimalPlaces: Buffer.from([0x02]),
                            minters: [this.hexToBuffer("0x47d082a115c63e7b58b1532d20e631538eafadde")],
                            ticker: "NCG",
                        },
                        "text"
                    ),
                    1n,
                ],
                recipient: this.hexToBuffer(recipient),
                sender: this.hexToBuffer(sender),
            }
        }, 'text'))).toString('hex');
    }

    private makeTransferInHeimdall(sender: string, recipient: string) {
        return Buffer.from(encode(new RecordView({
            type_id: 'transfer_asset5',
            values: {
                amount: [
                    new RecordView(
                        {
                            decimalPlaces: Buffer.from([0x02]),
                            minters: null,
                            ticker: "NCG",
                        },
                        "text"
                    ),
                    1n,
                ],
                recipient: this.hexToBuffer(recipient),
                sender: this.hexToBuffer(sender),
            }
        }, 'text'))).toString('hex');
    }

    hexToBuffer(hex: string): Buffer {
        return Buffer.from(
            ethers.utils.arrayify(hex, { allowMissingPrefix: true })
        );
    }

    pad32(msg: Buffer): Buffer {
        let buf: Buffer;
        if (msg.length < 32) {
            buf = Buffer.alloc(32);
            buf.fill(0);
            msg.copy(buf, 32 - msg.length);
            return buf;
        } else {
            return msg;
        }
    }

     async sendTx(endpoint: string, action: string, account): Promise<string | undefined> {
    const wallet = new ethers.Wallet(account.privateKey);
    
    // ✅ Nonce 값 중복 방지 (강제 증가)
    let nonce = await this.nextTxNonce(endpoint, account.address);
    console.log(`🔢 사용된 Nonce 값: ${nonce} (Account: ${account.address})`);

    const _unsignedTx = await this.unsignedTx(endpoint, wallet.publicKey.slice(2), action, nonce);
    
    const unsignedTxId = crypto.createHash('sha256').update(_unsignedTx, 'hex').digest();
    const { signature } = secp256k1.ecdsaSign(this.pad32(unsignedTxId), this.hexToBuffer(wallet.privateKey));

    const sign = Buffer.from(secp256k1.signatureExport(signature));
    const { data: { transaction: { signTransaction: signTx } } } = await this.signTransaction(endpoint, _unsignedTx, sign.toString('hex'));

    const { txId } = await this.stageTx(endpoint, signTx);
    console.log(`✅ 트랜잭션 성공: ${txId}`);
    
    return txId;
}


     async nextTxNonce(endpoint: string, address: string): Promise<number> {
        const {data} = await this.instanceForSend.post(endpoint, {
            variables: {address},
            query: `
              query getNextTxNonce($address: Address!){
                transaction{
                    nextTxNonce(address: $address)
                }
              }
            `})
        return data["data"]["transaction"]["nextTxNonce"];
    }


    async unsignedTx(endpoint: string, publicKey: string, plainValue: string, nonce: number): Promise<string> {
        const maxGasPrice: FungibleAssetValue = {
            quantity: 20,
            ticker: 'Mead',
            decimalPlaces: 18
        };

        const { data } = await this.instanceForSend.post(endpoint, {
            variables: { publicKey, plainValue, nonce, maxGasPrice },
            query: `
                query unsignedTx($publicKey: String!, $plainValue: String!, $nonce: Long, $maxGasPrice: FungibleAssetValueInputType) {
                  transaction {
                    unsignedTransaction(publicKey: $publicKey, plainValue: $plainValue nonce: $nonce, maxGasPrice: $maxGasPrice)
                  }
                }
              `})
        return data["data"]["transaction"]["unsignedTransaction"];
    }

     async signTransaction(endpoint: string, unsignedTx: string, base64Sign: string): Promise<any> {
        const { data } = await this.instanceForSend.post(endpoint, {
            "variables": { unsignedTx, signature: base64Sign },
            "query": `
                  query attachSignature($unsignedTx: String!, $signature: String!) {
                    transaction {
                      signTransaction(unsignedTransaction: $unsignedTx, signature: $signature)
                    }
                  }
                `
        })
        return data;
    }

    async stageTx(endpoint: string, payload: string): Promise<{ txId: string }> {
        const { data } = await this.instanceForSend.post(endpoint, {
            variables: {payload},
            query: `
            mutation transfer($payload: String!) {
              stageTransaction(payload: $payload)
            }
          `
        })
        try {
            return {txId: data["data"]["stageTransaction"]};
        } catch (e) {
            console.log(e, data);
            throw e;
        }
    }

    async getTxStatus(endpoint: string, txIds: string[]) {
    const { data } = await this.instanceForCheck.post(endpoint, {
        variables: { txIds },  // ✅ GraphQL 변수를 사용하여 안전하게 전달
        query: `
        query getTx($txIds: [String!]!) {
            transaction {
                transactionResults(txIds: $txIds) {
                    txStatus
                    exceptionNames
                }
            }
        }
        `
    });

    return data?.data?.transaction?.transactionResults || [];  // 응답 검증 추가
}



    async resolvePendingTransactions() {
        const pendingTransactions: Array<{ id: number, endpoint_url: string, txHash: string }> = await this.nodeHealthService.getPendingTransactions(); // 명시적 타입

        // endpoint_url 기준으로 그룹화
        const groupedTransactions = pendingTransactions.reduce<{ [key: string]: Array<{ id: number, endpoint_url: string, txHash: string }> }>((acc, row) => {
            if (!acc[row.endpoint_url]) {
                acc[row.endpoint_url] = [];
            }
            acc[row.endpoint_url].push(row);
            return acc;
        }, {});

        let checkEndpointUrl;
        // 각 endpoint_url 그룹별로 상태 조회 및 처리
        for (const [endpoint_url, transactions] of Object.entries(groupedTransactions)) {
            const txIds = transactions.map(tx => tx.txHash); // 해당 endpoint_url에 해당하는 txHash 배열

            if(endpoint_url.includes("heimdall"))
                checkEndpointUrl = "https://heimdall-rpc-1.nine-chronicles.com/graphql";
            else
                checkEndpointUrl = "https://odin-rpc-2.nine-chronicles.com/graphql";

            const statuses = await this.getTxStatus(checkEndpointUrl, txIds);
            // 5. 상태별로 처리
            for (const [index, status] of statuses.entries()) {
    const row = transactions[index]; // 각 상태에 대응하는 트랜잭션 정보

    if (!status || !status.txStatus) {
        console.error(`❌ 트랜잭션 상태를 확인할 수 없음. (ID: ${row.id}, TxHash: ${row.txHash})`);
        continue;
    }

                switch (status.txStatus) {
                    case 'SUCCESS':
                        console.log(`✅ 트랜잭션 성공! TxHash: ${row.txHash}`);
                        await this.nodeHealthService.updateCompletedTx(row.id);
                        break;

                    case 'STAGING':
                    case 'PENDING':
                        console.log(`⏳ 트랜잭션 대기 중 (ID: ${row.id}, TxHash: ${row.txHash})`);
                        await this.nodeHealthService.updateStagingTxBatch([row.id]);
                        break;

                    case 'FAILED':
                    case 'INVALID':
                        const errorMessage = status.exceptionNames?.join(', ') || '알 수 없음'; // 예외 정보 가져오기
                        console.error(`❌ 트랜잭션 실패! TxHash: ${row.txHash}, 이유: ${errorMessage}`);
                        await this.nodeHealthService.updateFailedTx([row.id], [errorMessage]);
                        break;

                    default:
                        console.warn(`⚠️ 예상치 못한 트랜잭션 상태: ${status.txStatus} (ID: ${row.id}, TxHash: ${row.txHash})`);
                        break;
                }
            }
        }
    }



}

interface FungibleAssetValue {
    quantity: number;
    ticker: string;
    decimalPlaces: number;
}