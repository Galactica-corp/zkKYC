pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/comparators.circom";

/*
Circuit checks that user corresponding to certain zkKYC record has reached age threshold
*/
template AgeProof(){
    // age info from 
    signal input yearOfBirth;
    signal input monthOfBirth;
    signal input dayOfBirth;

    // public time inputs
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;

    // age threshold
    signal input ageThreshold;

    // final result
    signal output valid;

    // check that user is older than the age threshold
    var combinedBirthInfo = yearOfBirth * 10000 + monthOfBirth * 100 + dayOfBirth;
    var combinedCurrentDate = currentYear * 10000 + currentMonth * 100 + currentDay;
    component compare = GreaterThan(128);
    compare.in[0] <== combinedCurrentDate;
    compare.in[1] <== combinedBirthInfo + ageThreshold * 10000;
    valid <== compare.out;
}