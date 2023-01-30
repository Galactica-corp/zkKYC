pragma solidity ^0.8.0;

contract MockGalacticaInstitution {

    uint[2] public institutionPubKey;
    
    function setInstitutionPubkey(uint[2] newInstitutionPubKey) public {
        institutionPubKey[0] = newInstitutionPubKey[0];
        institutionPubKey[1] = newInstitutionPubKey[1];
    }
}