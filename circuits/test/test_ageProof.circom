pragma circom 2.0.3;

include "../ageProof.circom";

component main {public [currentYear, currentMonth, currentDay, ageThreshold]} = AgeProof();