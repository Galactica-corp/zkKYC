pragma circom 2.0.3;

include "../zkKYC.circom";

component main {public [root, currentTime, userAddress, investigationInstitutionPubKey, encryptedData, humanID, dAppID]} = ZKKYC(32);