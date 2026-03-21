import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { PaymentProof, X402PaymentRequest } from './agent.types';

const WALLET_CONTRACT_ABI = [
  'function payForService(address recipient, uint256 amountWei, string endpointId, bytes32 nonce) payable returns (bytes32)',
];

@Injectable()
export class AvalanchePaymentService {
  async payForRequest(
    paymentRequest: X402PaymentRequest,
    providerId: string,
  ): Promise<PaymentProof> {
    const rpcUrl = process.env.AVAX_RPC_URL;
    const privateKey = process.env.AVAX_PRIVATE_KEY;
    const contractAddress = process.env.AVAX_WALLET_CONTRACT;

    if (!rpcUrl || !privateKey || !contractAddress) {
      return this.createMockProof(paymentRequest, providerId);
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const contract = new Contract(contractAddress, WALLET_CONTRACT_ABI, wallet);

    const nonce = paymentRequest.nonce
      ? this.toBytes32(paymentRequest.nonce)
      : this.toBytes32(`${providerId}-${Date.now()}`);

    const endpointId = paymentRequest.endpointId ?? providerId;

    const tx = await contract.payForService(
      paymentRequest.recipient,
      BigInt(paymentRequest.amountWei),
      endpointId,
      nonce,
    );

    const receipt = await tx.wait();
    const network = await provider.getNetwork();

    return {
      txHash: receipt?.hash ?? tx.hash,
      proof: `tx:${receipt?.hash ?? tx.hash}`,
      chainId: Number(network.chainId),
      paidAt: new Date().toISOString(),
    };
  }

  private createMockProof(
    paymentRequest: X402PaymentRequest,
    providerId: string,
  ): PaymentProof {
    const entropy = `${providerId}:${paymentRequest.amountWei}:${Date.now()}`;
    const encoded = Buffer.from(entropy, 'utf8').toString('base64url');

    return {
      txHash: `mock-${encoded.slice(0, 24)}`,
      proof: `mock-proof:${encoded}`,
      chainId: Number(process.env.AVAX_CHAIN_ID ?? 43113),
      paidAt: new Date().toISOString(),
    };
  }

  private toBytes32(value: string): string {
    const hex = Buffer.from(value, 'utf8').toString('hex').slice(0, 64);
    return `0x${hex.padEnd(64, '0')}`;
  }
}
