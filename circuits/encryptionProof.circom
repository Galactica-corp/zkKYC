pragma circom 2.0.3;

include "privToPubKey.circom";
include "ecdh.circom";
include "mimcEncrypt.circom";

/*
  Circuit proving that a message is correctly encrypted so that the receiver can read it. 
  It is based on public private keypairs and the ECDH key exchange protocol
  (symmetric encryption key derived from sender's private key and receiver's public key = the other way around).

  In Galactica's zkKYC, this is used to proof that the KYC holder provides encrypted information for eventual fraud investigation.
*/
template encryptionProof(){
    signal input senderPrivKey;
    signal input senderPubKey[2]; //should be public input
    signal input receiverPubKey[2]; //should be public input
    signal input msg[2];

    signal output encryptedMsg[2]; //should be public input

    // check that the sender uses the private key for encryption that corresponds to his public key
    component privToPub = PrivToPubKey();
    privToPub.privKey <== senderPrivKey;
    privToPub.pubKey[0] === senderPubKey[0];
    privToPub.pubKey[1] === senderPubKey[1];

    // derive the symmetric encryption key
    component ecdh = Ecdh();
    ecdh.privKey <== senderPrivKey;
    ecdh.pubKey[0] <== receiverPubKey[0];
    ecdh.pubKey[1] <== receiverPubKey[1];

    // encrypt the msg
    component encrypt = MiMCFeistelEncrypt(220);
	encrypt.k <== ecdh.sharedKey[0]; // for MiMC we only need one element, so use first part of the shared ECDH key
	encrypt.xL_in <== msg[0];
	encrypt.xR_in <== msg[1];

	encryptedMsg[0] <== encrypt.xL_out;
	encryptedMsg[1] <== encrypt.xR_out;
}
