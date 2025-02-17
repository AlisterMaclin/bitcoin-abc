import { ValidationError } from 'ecashaddrjs';
import {
    fromSmallestDenomination,
    formatBalance,
    batchArray,
    flattenBatchedHydratedUtxos,
    loadStoredWallet,
    isValidStoredWallet,
    fromLegacyDecimals,
    convertToEcashPrefix,
    checkNullUtxosForTokenStatus,
    confirmNonEtokenUtxos,
    isLegacyMigrationRequired,
    toLegacyCash,
    toLegacyToken,
    toLegacyCashArray,
} from '@utils/cashMethods';

import {
    unbatchedArray,
    arrayBatchedByThree,
} from '../__mocks__/mockBatchedArrays';
import {
    validAddressArrayInput,
    validAddressArrayInputMixedPrefixes,
    validAddressArrayOutput,
    validLargeAddressArrayInput,
    validLargeAddressArrayOutput,
    invalidAddressArrayInput,
} from '../__mocks__/mockAddressArray';

import {
    unflattenedHydrateUtxosResponse,
    flattenedHydrateUtxosResponse,
} from '../__mocks__/flattenBatchedHydratedUtxosMocks';
import {
    cachedUtxos,
    utxosLoadedFromCache,
} from '../__mocks__/mockCachedUtxos';
import {
    validStoredWallet,
    invalidStoredWallet,
} from '../__mocks__/mockStoredWallets';

import {
    mockTxDataResults,
    mockNonEtokenUtxos,
    mockTxDataResultsWithEtoken,
    mockHydratedUtxosWithNullValues,
    mockHydratedUtxosWithNullValuesSetToFalse,
} from '../__mocks__/nullUtxoMocks';

import {
    missingPath1899Wallet,
    missingPublicKeyInPath1899Wallet,
    missingPublicKeyInPath145Wallet,
    missingPublicKeyInPath245Wallet,
    notLegacyWallet,
} from '../__mocks__/mockLegacyWallets';

describe('Correctly executes cash utility functions', () => {
    it(`Correctly converts smallest base unit to smallest decimal for cashDecimals = 2`, () => {
        expect(fromSmallestDenomination(1, 2)).toBe(0.01);
    });
    it(`Correctly converts largest base unit to smallest decimal for cashDecimals = 2`, () => {
        expect(fromSmallestDenomination(1000000012345678, 2)).toBe(
            10000000123456.78,
        );
    });
    it(`Correctly converts smallest base unit to smallest decimal for cashDecimals = 8`, () => {
        expect(fromSmallestDenomination(1, 8)).toBe(0.00000001);
    });
    it(`Correctly converts largest base unit to smallest decimal for cashDecimals = 8`, () => {
        expect(fromSmallestDenomination(1000000012345678, 8)).toBe(
            10000000.12345678,
        );
    });
    it(`Correctly converts an array of length 10 to an array of 4 arrays, each with max length 3`, () => {
        expect(batchArray(unbatchedArray, 3)).toStrictEqual(
            arrayBatchedByThree,
        );
    });
    it(`If array length is less than batch size, return original array as first and only element of new array`, () => {
        expect(batchArray(unbatchedArray, 20)).toStrictEqual([unbatchedArray]);
    });
    it(`Flattens hydrateUtxos from Promise.all() response into array that can be parsed by getSlpBalancesAndUtxos`, () => {
        expect(
            flattenBatchedHydratedUtxos(unflattenedHydrateUtxosResponse),
        ).toStrictEqual(flattenedHydrateUtxosResponse);
    });
    it(`Accepts a cachedWalletState that has not preserved BigNumber object types, and returns the same wallet state with BigNumber type re-instituted`, () => {
        expect(loadStoredWallet(cachedUtxos)).toStrictEqual(
            utxosLoadedFromCache,
        );
    });
    it(`Recognizes a stored wallet as valid if it has all required fields`, () => {
        expect(isValidStoredWallet(validStoredWallet)).toBe(true);
    });
    it(`Recognizes a stored wallet as invalid if it is missing required fields`, () => {
        expect(isValidStoredWallet(invalidStoredWallet)).toBe(false);
    });
    it(`Converts a legacy BCH amount to an XEC amount`, () => {
        expect(fromLegacyDecimals(0.00000546, 2)).toStrictEqual(5.46);
    });
    it(`Leaves a legacy BCH amount unchanged if currency.cashDecimals is 8`, () => {
        expect(fromLegacyDecimals(0.00000546, 8)).toStrictEqual(0.00000546);
    });
    it(`convertToEcashPrefix converts a bitcoincash: prefixed address to an ecash: prefixed address`, () => {
        expect(
            convertToEcashPrefix(
                'bitcoincash:qz2708636snqhsxu8wnlka78h6fdp77ar5ulhz04hr',
            ),
        ).toBe('ecash:qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035');
    });
    it(`convertToEcashPrefix returns an ecash: prefix address unchanged`, () => {
        expect(
            convertToEcashPrefix(
                'ecash:qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035',
            ),
        ).toBe('ecash:qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035');
    });
    it(`toLegacyToken returns an etoken: prefix address as simpleledger:`, () => {
        expect(
            toLegacyToken('etoken:qz2708636snqhsxu8wnlka78h6fdp77ar5tv2tzg4r'),
        ).toBe('simpleledger:qz2708636snqhsxu8wnlka78h6fdp77ar5syue64fa');
    });
    it(`toLegacyToken returns an prefixless valid etoken address in simpleledger: format with prefix`, () => {
        expect(
            toLegacyToken('qz2708636snqhsxu8wnlka78h6fdp77ar5tv2tzg4r'),
        ).toBe('simpleledger:qz2708636snqhsxu8wnlka78h6fdp77ar5syue64fa');
    });
    it(`test formatBalance with an input of 0`, () => {
        expect(formatBalance('0')).toBe('0');
    });
    it(`test formatBalance with zero XEC balance input`, () => {
        expect(formatBalance('0', 'en-US')).toBe('0');
    });
    it(`test formatBalance with a small XEC balance input with 2+ decimal figures`, () => {
        expect(formatBalance('1574.5445', 'en-US')).toBe('1,574.54');
    });
    it(`test formatBalance with 1 Million XEC balance input`, () => {
        expect(formatBalance('1000000', 'en-US')).toBe('1,000,000');
    });
    it(`test formatBalance with 1 Billion XEC balance input`, () => {
        expect(formatBalance('1000000000', 'en-US')).toBe('1,000,000,000');
    });
    it(`test formatBalance with total supply as XEC balance input`, () => {
        expect(formatBalance('21000000000000', 'en-US')).toBe(
            '21,000,000,000,000',
        );
    });
    it(`test formatBalance with > total supply as XEC balance input`, () => {
        expect(formatBalance('31000000000000', 'en-US')).toBe(
            '31,000,000,000,000',
        );
    });
    it(`test formatBalance with no balance`, () => {
        expect(formatBalance('', 'en-US')).toBe('0');
    });
    it(`test formatBalance with null input`, () => {
        expect(formatBalance(null, 'en-US')).toBe('0');
    });
    it(`test formatBalance with undefined as input`, () => {
        expect(formatBalance(undefined, 'en-US')).toBe('NaN');
    });
    it(`test formatBalance with non-numeric input`, () => {
        expect(formatBalance('CainBCHA', 'en-US')).toBe('NaN');
    });

    it(`Correctly parses utxo vout tx data to confirm the transactions are not eToken txs`, () => {
        expect(checkNullUtxosForTokenStatus(mockTxDataResults)).toStrictEqual(
            mockNonEtokenUtxos,
        );
    });
    it(`Correctly parses utxo vout tx data and screens out an eToken by asm field`, () => {
        expect(
            checkNullUtxosForTokenStatus(mockTxDataResultsWithEtoken),
        ).toStrictEqual([]);
    });
    it(`Changes isValid from 'null' to 'false' for confirmed nonEtokenUtxos`, () => {
        expect(
            confirmNonEtokenUtxos(
                mockHydratedUtxosWithNullValues,
                mockNonEtokenUtxos,
            ),
        ).toStrictEqual(mockHydratedUtxosWithNullValuesSetToFalse);
    });
    it(`Recognizes a wallet with missing Path1889 is a Legacy Wallet and requires migration`, () => {
        expect(isLegacyMigrationRequired(missingPath1899Wallet)).toBe(true);
    });
    it(`Recognizes a wallet with missing PublicKey in Path1889 is a Legacy Wallet and requires migration`, () => {
        expect(
            isLegacyMigrationRequired(missingPublicKeyInPath1899Wallet),
        ).toBe(true);
    });
    it(`Recognizes a wallet with missing PublicKey in Path145 is a Legacy Wallet and requires migration`, () => {
        expect(isLegacyMigrationRequired(missingPublicKeyInPath145Wallet)).toBe(
            true,
        );
    });
    it(`Recognizes a wallet with missing PublicKey in Path245 is a Legacy Wallet and requires migration`, () => {
        expect(isLegacyMigrationRequired(missingPublicKeyInPath245Wallet)).toBe(
            true,
        );
    });
    it(`Recognizes a latest, current wallet that does not require migration`, () => {
        expect(isLegacyMigrationRequired(notLegacyWallet)).toBe(false);
    });

    test('toLegacyCash() converts a valid ecash: prefix address to a valid bitcoincash: prefix address', async () => {
        const result = toLegacyCash(
            'ecash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gtfza25mc',
        );
        expect(result).toStrictEqual(
            'bitcoincash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gjykk3wa0',
        );
    });

    test('toLegacyCash() converts a valid ecash: prefixless address to a valid bitcoincash: prefix address', async () => {
        const result = toLegacyCash(
            'qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gtfza25mc',
        );
        expect(result).toStrictEqual(
            'bitcoincash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gjykk3wa0',
        );
    });

    test('toLegacyCash throws error if input address has invalid checksum', async () => {
        const result = toLegacyCash(
            'ecash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gtfza25m',
        );
        expect(result).toStrictEqual(
            new Error(
                'ecash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gtfza25m is not a valid ecash address',
            ),
        );
    });

    test('toLegacyCash() throws error with input of etoken: address', async () => {
        const result = toLegacyCash(
            'etoken:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4g9htlunl0',
        );
        expect(result).toStrictEqual(
            new Error(
                'etoken:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4g9htlunl0 is not a valid ecash address',
            ),
        );
    });

    test('toLegacyCash() throws error with input of legacy address', async () => {
        const result = toLegacyCash('13U6nDrkRsC3Eb1pxPhNY8XJ5W9zdp6rNk');
        expect(result).toStrictEqual(
            new Error(
                '13U6nDrkRsC3Eb1pxPhNY8XJ5W9zdp6rNk is not a valid ecash address',
            ),
        );
    });

    test('toLegacyCash() throws error with input of bitcoincash: address', async () => {
        const result = toLegacyCash(
            'bitcoincash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gjykk3wa0',
        );
        expect(result).toStrictEqual(
            new Error(
                'bitcoincash:qqd3qn4zazjhygk5a2vzw2gvqgqwempr4gjykk3wa0 is not a valid ecash address',
            ),
        );
    });

    test('toLegacyCashArray throws error if the addressArray input is null', async () => {
        const result = toLegacyCashArray(null);

        expect(result).toStrictEqual(new Error('Invalid addressArray input'));
    });

    test('toLegacyCashArray throws error if the addressArray input is empty', async () => {
        const result = toLegacyCashArray([]);

        expect(result).toStrictEqual(new Error('Invalid addressArray input'));
    });

    test('toLegacyCashArray throws error if the addressArray input is a number', async () => {
        const result = toLegacyCashArray(12345);

        expect(result).toStrictEqual(new Error('Invalid addressArray input'));
    });

    test('toLegacyCashArray throws error if the addressArray input is undefined', async () => {
        const result = toLegacyCashArray(undefined);

        expect(result).toStrictEqual(new Error('Invalid addressArray input'));
    });

    test('toLegacyCashArray successfully converts a standard sized valid addressArray input', async () => {
        const result = toLegacyCashArray(validAddressArrayInput);

        expect(result).toStrictEqual(validAddressArrayOutput);
    });

    test('toLegacyCashArray successfully converts a standard sized valid addressArray input including prefixless ecash addresses', async () => {
        const result = toLegacyCashArray(validAddressArrayInputMixedPrefixes);

        expect(result).toStrictEqual(validAddressArrayOutput);
    });

    test('toLegacyCashArray successfully converts a large valid addressArray input', async () => {
        const result = toLegacyCashArray(validLargeAddressArrayInput);

        expect(result).toStrictEqual(validLargeAddressArrayOutput);
    });

    test('toLegacyCashArray throws an error on an addressArray with invalid addresses', async () => {
        const result = toLegacyCashArray(invalidAddressArrayInput);

        expect(result).toStrictEqual(
            new Error(
                'ecash:qrqgwxrrrrrrrrrrrrrrrrrrrrrrrrr7zsvk is not a valid ecash address',
            ),
        );
    });
});
