pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
  Circuit calculating the dApp specific human ID. 
  It can be used by applications that want to limit the amount of interactions per human, e.g., for voting or IDO allocation.

  Calculated by hashing KYC fields uniquely identifying a human together with the dApp ID for preventing cross reference with other dApps.
  As good practise, the dApp can also use multiple IDs for preventing cross reference between different use cases.
  For example one dApp ID per topic to vote on or one dApp ID per IDO pool.
*/
template HumanID(){
    signal input surname;
    signal input forename;
    signal input middlename;
    signal input yearOfBirth;
    signal input monthOfBirth;
    signal input dayOfBirth;
    signal input passportID; // KYC providers should ensure that only passports are accepted, so that there are no other card ids for the same person, e.g. drivers license
    signal input dAppID;

    // zkCertHash as output
    signal output humanID;

    component hash = Poseidon(8);
    hash.inputs[0] <== surname;
    hash.inputs[1] <== forename;
    hash.inputs[2] <== middlename;
    hash.inputs[3] <== yearOfBirth;
    hash.inputs[4] <== monthOfBirth;
    hash.inputs[5] <== dayOfBirth;
    hash.inputs[6] <== passportID;
    hash.inputs[7] <== dAppID;

    humanID <== hash.out;
}