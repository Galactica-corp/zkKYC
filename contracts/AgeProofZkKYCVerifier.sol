// THIS FILE IS GENERATED BY HARDHAT-CIRCOM. DO NOT EDIT THIS FILE.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.11;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract AgeProofZkKYCVerifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            5554442530759022762851616730214715679111052835687046476408118118186310047617,
            13640692608193219536270847567043767921234842769719166073437283415226884045561
        );

        vk.beta2 = Pairing.G2Point(
            [16265250414816618821280020544828853681144933699805040104783574602188409234737,
             21781508424796666299457097999278517211619284668083002660456088821721884888105],
            [3736828092341828648341184322704031136390303518405998059130947221707357321563,
             13001862284669821263394200027444611362733142733303785417828259588388133879393]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [19200910917243667800529535998630390141495552878137018885601625105141503627355,
             21478763164693000567899070823239516847328812973397654460807687130322612682756],
            [3812102349685869411933035927582482375064024274609433856494914597431656786245,
             197374322395822641562288059678581446973061374544753447991710635574309265891]
        );
        vk.IC = new Pairing.G1Point[](17);
        
        vk.IC[0] = Pairing.G1Point( 
            4881598885068937216996846456332767031141513573397129847355464412472235709186,
            17972072462302077254036715801205752732034362172127109189689326452870246517212
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            2714202117359567685648390782002687476954005427135287333536431354915983460565,
            15284364624265511689050946435567954138708804639904945290676526987181065363895
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            9982468197020879931344764273167210842571518943332186105543248615796863180196,
            6031317878180680678158669560932449520014879223458626274194574751645315725943
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            8709784888297470198472192790497786746452161038900625029920548892029124626337,
            8098047199736707530198237785573722895220395218703531624167929633192139249073
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            7079793541872403159823884425888169025567640732706063083294354030592411790114,
            10005311154869014326764862204037015602757582140769261708300766725739238658042
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            2716695136260599475892799616999350602669417104997256507010413310956772473472,
            289006438170778599037448548561196379878647325225199914737005987439029466798
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            14163393431257193915892136167113049145812368899531961873196072422627464163945,
            10817097374196136703465087008452683336623069307375393523453316444266222459196
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            2170507783560802000579553456159708618400271401199588387244228490583997957516,
            987573581914506278467904056323439940851948344858555787268328424679440081761
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            18762169432176159938362053832076921767325845533256464013886688950123829705570,
            1811209883749202906537269489411426002443292272527179762242128372705828759303
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            1713682547542219844057727040985872693088303779218649585098915882447983109570,
            10363778299152218478170719419369019073011840293226554133258109763627647631758
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            3342922448181759373841432386389627598509643269235656378421310255815859031164,
            11888224809757053918128174652679762310405729685352819770562818710635440500186
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            7978366512999825999836746145292562111094500876170972307140303077741664388218,
            12838515135915416534139042136033671234146059208748301840529034503005217335288
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            9927041434526535345217536634834847326768452529064916333635322317888277415446,
            3385041084799569765727768568492660168305247712249143268833942965260176641623
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            6512119475079937049398702480873209115721921116170597508031809620953587284088,
            3217050767283213299682934640987507363709339167124871832717549536904503587106
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            13159427331676789521479821145598392063825636807285434675206846253105593554435,
            7725996366657213121929322946677107864281693169225504834391837758022719487840
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            19796305661757611850953959203198829993524390365200427918924982473458375886579,
            6628272767816423684361073773002375449826667908171828652978613319837075257326
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            17310648347117374475695377709359140078705209791224008212393609392942757323024,
            5392241518271744163609076490844812514038236156495110525832395316907487650020
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[16] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
