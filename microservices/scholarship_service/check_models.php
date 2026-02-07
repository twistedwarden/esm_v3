<?php

require __DIR__ . '/vendor/autoload.php';

$apiKey = 'AIzaSyDZjj76t9g51hnBPUfVmbr6sUntmnNUMu4'; // Using the key user provided
$url = "https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}";

echo "Checking models for key: " . substr($apiKey, 0, 5) . "...\n";
echo "URL: $url\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
$data = json_decode($response, true);

if (isset($data['models'])) {
    echo "Available Models:\n";
    foreach ($data['models'] as $model) {
        // Remove 'models/' prefix for cleaner output
        $name = str_replace('models/', '', $model['name']);
        echo "- $name\n";
    }
} else {
    echo "Could not list models. Raw response:\n$response\n";
}
