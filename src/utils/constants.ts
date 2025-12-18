/**
 * Constants used throughout the GPAPI MCP Server.
 */

// API CONFIGURATION
export const API_VERSION = "2021-03-22";
export const MCP_PROTOCOL_VERSION = "2025-06-18";

// BASE URLS
export const BASE_URL_CERT = "https://apis-cert.globalpay.com";
export const BASE_URL_SANDBOX = "https://apis.sandbox.globalpay.com";
export const BASE_URL_PROD = "https://apis.globalpay.com";

// API ENDPOINTS
export const ENDPOINT_ACCESS_TOKEN = "/ucp/mcp/accesstoken";
export const ENDPOINT_LINKS = "/ucp/links";

// HTTP HEADERS
export const HEADER_CONTENT_TYPE = "Content-Type";
export const HEADER_ACCEPT = "Accept";
export const HEADER_AUTHORIZATION = "Authorization";
export const HEADER_GP_VERSION = "X-GP-Version";
export const HEADER_MCP_VERSION = "MCP-Protocol-Version";

// HTTP CONTENT TYPES & AUTH
export const CONTENT_TYPE_JSON = "application/json";
export const AUTH_SCHEME_BEARER = "Bearer";

// VALIDATION REGEX PATTERNS
export const REGEX_CURRENCY_CODE = /^[A-Z]{3}$/;
export const REGEX_COUNTRY_CODE = /^[A-Z]{2}$/;
export const REGEX_DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

// DEFAULT VALUES - PAYMENT LINKS
export const DEFAULT_LINK_NAME = "Global Payments Payment Link";
export const DEFAULT_LINK_DESCRIPTION = "No Description Provided";
export const DEFAULT_PAYMENT_TYPE = "PAYMENT";
export const DEFAULT_CHANNEL = "CNP";
export const DEFAULT_PAYMENT_METHOD = ["CARD"];
export const DEFAULT_USAGE_MODE = "SINGLE";
export const DEFAULT_SHIPPABLE = "NO";
export const DEFAULT_MULTIPLE_USAGE_LIMIT = 50;

// DEFAULT VALUES - AUTHENTICATION
export const DEFAULT_TOKEN_EXPIRY_INTERVAL = "10_MINUTES";
export const DEFAULT_TOKEN_PERMISSIONS = ["LNK_POST_Create", "LNK_GET_List", "LNK_GET_Single"];
export const DEFAULT_TOKEN_REFRESH_BUFFER = 30;
export const DEFAULT_TOKEN_EXPIRY_SECONDS = 599;
export const GRANT_TYPE = "client_credentials";
export const TOKEN_INTERVAL_SUFFIX = "_minutes";
export const TOKEN_INTERVAL_MULTIPLIER = 59;

// DEFAULT VALUES - IDENTIFIERS
export const DEFAULT_IDENTIFIER_PREFIX = "mcp";
export const DEFAULT_MIN_IDENTIFIER_LENGTH = 12;
export const DEFAULT_MAX_IDENTIFIER_LENGTH = 20;
export const NONCE_PREFIX = "mcp_";

// DEFAULT VALUES - SYSTEM
export const DEFAULT_HTTP_TIMEOUT = 30.0;
export const DEFAULT_LOG_LEVEL = "INFO";

// VALIDATION LIMITS - AMOUNTS & PAGINATION
export const MIN_AMOUNT = 1;
export const MIN_SHIPPING_AMOUNT = 0;
export const MIN_USAGE_LIMIT = 1;
export const MIN_PAGE_NUMBER = 1;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 1000;

// VALIDATION LIMITS - CARD NUMBERS & SECURITY
export const MIN_CARD_LENGTH = 13;
export const MAX_CARD_LENGTH = 19;
export const MASK_CHARACTER = "*";
export const ERROR_RESPONSE_PREVIEW_LENGTH = 200;

// ENUM VALUES - PAYMENT LINKS
export const LINK_STATUSES = ["ACTIVE", "CLOSED", "PAID", "INACTIVE", "EXPIRED"];
export const USAGE_MODES = ["SINGLE", "MULTIPLE"];
export const SHIPPABLE_VALUES = ["YES", "NO"];
export const ORDER_VALUES = ["ASC", "DESC"];

// AMOUNT FORMATTING
export const AMOUNT_DISPLAY_DIVISOR = 100;
export const AMOUNT_DECIMAL_PLACES = 2;

// SECURITY & SENSITIVE DATA
export const SENSITIVE_KEYS = ["authorization", "secret", "app_secret", "token", "password"];

// API RESPONSE FIELD NAMES
export const FIELD_INTERVAL_TO_EXPIRE = "interval_to_expire";
export const FIELD_SECONDS_TO_EXPIRE = "seconds_to_expire";
export const FIELD_SCOPE = "scope";
export const FIELD_ACCOUNTS = "accounts";
export const FIELD_NAME = "name";

// CONTEXT STRINGS - VALIDATION
export const CONTEXT_TOOL_ARGUMENTS = "tool_arguments";
export const CONTEXT_API_REQUEST = "api_request";
export const CONTEXT_API_REQUEST_PARAMS = "api_request_params";
export const CONTEXT_REQUEST_VALIDATION = "Request validation";
export const CONTEXT_RESPONSE_VALIDATION = "Response validation";

// CONTEXT STRINGS - API OPERATIONS
export const CONTEXT_TOKEN_ACQUISITION = "Token acquisition";
export const CONTEXT_DOCUMENTATION_FETCH = "Documentation fetch";
export const CONTEXT_API_CALL = "API request";

// CONTEXT STRINGS - TOOL OPERATIONS
export const CONTEXT_PAYMENT_LINK_CREATION = "Payment link creation";
export const CONTEXT_PAYMENT_LINK_VALIDATION = "Payment link validation";
export const CONTEXT_GET_DOCUMENTATION = "Get documentation";
export const CONTEXT_DOCUMENTATION_VALIDATION = "Documentation validation";
export const CONTEXT_GET_LINKS = "Get links";
export const CONTEXT_GET_LINKS_VALIDATION = "Get links validation";

// ERROR MESSAGES - SECURITY
export const ERROR_MSG_CARD_DETECTED = "Card number detected in data. Card numbers are not allowed.";
export const ERROR_MSG_CARD_TRANSMISSION_FORBIDDEN = "Transmitting raw card numbers is not allowed for PCI DSS compliance.";
export const ERROR_MSG_SECURITY_VIOLATION_REQUEST = "Security violation: Card numbers are not allowed";
export const ERROR_MSG_SECURITY_VIOLATION_DETECTED = "Card numbers detected in request payload";
export const ERROR_MSG_SECURITY_VIOLATION_PARAMS = "Card numbers detected in request parameters";

// ERROR MESSAGES - CONFIGURATION
export const ERROR_MSG_API_CLIENT_NOT_CONFIGURED = "API client not configured for authentication manager";
export const ERROR_MSG_AUTH_MANAGER_REQUIRED = "Authentication manager is required for authenticated API calls";
export const ERROR_MSG_SHIPPING_AMOUNT_MANDATORY = "shipping_amount is mandatory when shippable is YES";

// SUCCESS MESSAGES
export const SUCCESS_MSG_PAYMENT_LINK_CREATED = "Payment link created successfully. You can share this link with your customer for payment.";

// LOG MESSAGES
export const LOG_MSG_QUERY_PARAMS_IN_URL = "Query parameters detected in URL - extracting to params dictionary";
