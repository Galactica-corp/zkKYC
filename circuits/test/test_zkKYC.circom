pragma circom 2.0.3;

include "../zkKYC.circom";

component main {public [root, currentTime, userAddress, investigationInstitutionPubKey, humanID, dAppAddress]} = ZKKYC(32);