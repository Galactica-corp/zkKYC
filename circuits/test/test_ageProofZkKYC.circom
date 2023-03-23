pragma circom 2.0.3;

include "../ageProofZkKYC.circom";

component main {public [root, currentTime, userAddress, currentYear, currentMonth, currentDay, ageThreshold, investigationInstitutionPubKey, humanID, dAppAddress]} = AgeProofZkKYC(32);