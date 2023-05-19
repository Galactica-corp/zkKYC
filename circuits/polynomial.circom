/* Copyright (C) 2023 Galactica Network. This file is part of zkKYC. zkKYC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. zkKYC is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. */
pragma circom 2.1.4;

/*
    Polynomial with k coefficients (degree k-1)
*/
template Polynomial(k) {
    signal input coef[k];
    signal input x;
    signal output y;

    signal powerOfX[k];
    powerOfX[0] <== 1;
    signal summingUp[k];
    summingUp[0] <== coef[0];

    for (var i = 1; i < k; i++) {
        powerOfX[i] <== powerOfX[i-1] * x;
        summingUp[i] <== summingUp[i-1] + coef[i] * powerOfX[i];
    }

    y <== summingUp[k-1];
}
