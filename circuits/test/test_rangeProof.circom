pragma circom 2.0.3;

include "../rangeProof.circom";

component main {public [root, currentYear, currentMonth, currentDay, ageThreshold]} = RangeProof(32);