pragma circom 2.0.3;

include "../zkKYC.circom";

component main {public [root, currentTime]} = ZKKYC(32);