pragma circom 2.0.3;

include "../authorization.circom";

component main {public[userAddress]} = Authorization();