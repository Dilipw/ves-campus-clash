<?php

return [

    'paths' => [
        'api/*',
        'media/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'https://ves.sundigit.in/',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];