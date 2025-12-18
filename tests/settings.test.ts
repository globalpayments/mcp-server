/**
 * Tests for settings configuration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getSettings, resetSettings } from '../src/config/settings.js';

describe('Settings', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    resetSettings();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetSettings();
  });

  it('should load settings with valid GPAPI_APP', () => {
    process.env.GPAPI_APP = 'test_app_id:test_app_secret';
    
    const settings = getSettings();
    expect(settings.gpapi_app_id).toBe('test_app_id');
    expect(settings.gpapi_app_secret).toBe('test_app_secret');
  });

  it('should throw error for invalid GPAPI_APP format', () => {
    process.env.GPAPI_APP = 'invalid_format';
    
    expect(() => getSettings()).toThrow('GPAPI_APP must be in format');
  });

  it('should throw error for empty APP_ID', () => {
    process.env.GPAPI_APP = ':secret';
    
    expect(() => getSettings()).toThrow('Both APP_ID and APP_SECRET must be non-empty');
  });

  it('should throw error for empty APP_SECRET', () => {
    process.env.GPAPI_APP = 'app_id:';
    
    expect(() => getSettings()).toThrow('Both APP_ID and APP_SECRET must be non-empty');
  });

  it('should set SANDBOX base URL by default', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings = getSettings();
    expect(settings.env).toBe('SANDBOX');
    expect(settings.gpapi_base_url).toContain('sandbox');
  });

  it('should set PROD base URL when ENV is PROD', () => {
    process.env.GPAPI_APP = 'app:secret';
    process.env.ENV = 'PROD';
    
    const settings = getSettings();
    expect(settings.env).toBe('PROD');
    expect(settings.gpapi_base_url).not.toContain('sandbox');
  });
  
  it('should handle optional account name', () => {
    process.env.GPAPI_APP = 'app:secret';
    process.env.GPAPI_ACCOUNT_NAME = 'test_account';
    
    const settings = getSettings();
    expect(settings.gpapi_account_name).toBe('test_account');
  });

  it('should handle optional account ID', () => {
    process.env.GPAPI_APP = 'app:secret';
    process.env.GPAPI_ACCOUNT_ID = 'acc_123';
    
    const settings = getSettings();
    expect(settings.gpapi_account_id).toBe('acc_123');
  });

  it('should use default token permissions', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings = getSettings();
    expect(settings.token_permissions).toContain('LNK_POST_Create');
  });

  it('should parse custom token permissions from JSON', () => {
    resetSettings(); // Ensure clean state
    process.env.GPAPI_APP = 'app:secret';
    process.env.TOKEN_PERMISSIONS = '["PERM1", "PERM2"]';
    delete process.env.GPAPI_ENV; // Ensure defaults
    
    const settings = getSettings();
    expect(settings.token_permissions).toEqual(['PERM1', 'PERM2']);
  });

  it('should parse custom token permissions from comma-separated', () => {
    resetSettings(); // Ensure clean state
    process.env.GPAPI_APP = 'app:secret';
    process.env.TOKEN_PERMISSIONS = 'PERM1,PERM2,PERM3';
    delete process.env.GPAPI_ENV; // Ensure defaults
    
    const settings = getSettings();
    expect(settings.token_permissions).toEqual(['PERM1', 'PERM2', 'PERM3']);
  });

  it('should use default HTTP timeout', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings = getSettings();
    expect(settings.http_timeout).toBe(30.0);
  });

  it('should use default log level', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings = getSettings();
    expect(settings.log_level).toBe('INFO');
  });

  it('should cache settings after first load', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings1 = getSettings();
    const settings2 = getSettings();
    
    expect(settings1).toBe(settings2); // Same object reference
  });

  it('should reset settings cache', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings1 = getSettings();
    resetSettings();
    process.env.GPAPI_APP = 'new_app:new_secret';
    const settings2 = getSettings();
    
    expect(settings1.gpapi_app_id).toBe('app');
    expect(settings2.gpapi_app_id).toBe('new_app');
  });

  it('should handle debug_api_calls flag', () => {
    process.env.GPAPI_APP = 'app:secret';
    process.env.DEBUG_API_CALLS = 'true';
    
    const settings = getSettings();
    expect(settings.debug_api_calls).toBe(true);
  });

  it('should default debug_api_calls to false', () => {
    process.env.GPAPI_APP = 'app:secret';
    
    const settings = getSettings();
    expect(settings.debug_api_calls).toBe(false);
  });
});
