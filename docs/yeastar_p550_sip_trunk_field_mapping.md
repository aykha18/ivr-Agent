# Yeastar P550 SIP Trunk CSV → Admin UI (OCPanel) Field Mapping

## Source
- **File**: `P550-sip_trunk-37.24.0.30-export-20260822173825-oZQygOnhs9maIT73.csv`
- **System**: Yeastar P550 / P-Series OCPanel 37.24.0.30
- **Context**: SIP Trunk → Trunk List export

---

## General Tab

| CSV Column | OCPanel Admin UI Field | Notes |
|---|---|---|
| Name | Trunk Name | Display name for the trunk |
| Trunk Status | Status | `1` = Enabled |
| Trunk Type | Trunk Type | `peer` = Peer Trunk |
| Transport | Transport | `udp` / `tcp` / `tls` |
| Hostname/IP | Host | Remote SIP server address |
| Port | Port | SIP signaling port |
| Domain | Domain | SIP domain for the trunk |
| Username | Username | Authentication username |
| Password | Password | Authentication password |
| Authentication Name | Authentication Name | SIP auth user (can differ from Username) |
| Enable Outbound Proxy | Outbound Proxy | `0` = disabled, `1` = enabled |
| Outbound Proxy Server | Outbound Proxy Server | Proxy hostname/IP |
| Port of Outbound Proxy Server | Port of Outbound Proxy Server | Proxy port |

## Codec Tab

| CSV Column | OCPanel Admin UI Field | Notes |
|---|---|---|
| Codec Setting | Codec Preference | Priority list (e.g. `ulaw&alaw&g729`) |
| DTMF Mode | DTMF Mode | `rfc4733` / `inband` / `auto` / `sipinfo` |
| Enable SRTP | SRTP | `0` = disabled, `1` = enabled |
| T.38 Support | T.38 Support | `0` = disabled, `1` = enabled |
| Inband Progress | Inband Progress | `0` = disabled, `1` = enabled |

## Advanced Tab

| CSV Column | OCPanel Admin UI Field | Notes |
|---|---|---|
| Qualify | Qualify | `0` = disabled, `1` = enabled (keep-alive) |
| Ignore 183 Message without SDP | Ignore 183 Message without SDP | `0`/`1` |
| Force SIP URI Scheme | Force SIP URI Scheme | `0`/`1` |
| Ignore 100 Response | Ignore 100 Response | `0`/`1` |
| Enable RTP Keep-alive | RTP Keep-alive | `0`/`1` |
| Maximum Concurrent Calls | Maximum Concurrent Calls | Integer limit |
| Call Restriction Type | Call Restriction Type | `outbound` / `inbound` / `both` |
| Outbound Failover SIP Code | Failover SIP Code | e.g. `default` |
| SIP Codes | SIP Codes | Custom SIP response codes mapping |

## DID / Caller ID Tab

| CSV Column | OCPanel Admin UI Field | Notes |
|---|---|---|
| Default Outbound Caller ID | Default Outbound Caller ID | Numeric caller ID |
| Default Outbound Caller ID Name | Default Outbound Caller ID Name | Caller ID name |
| Get Caller ID From | Get Caller ID From | `contact` / `from_system` / `default` |
| Get DID From | Get DID From | `follow_system` / `from_uri` |
| From User Part | From User Part | Custom FROM user |
| From Display Name Part | From Display Name | Custom FROM display name |
| Diversion | Diversion | `0`/`1` — pass diversion header |
| Remote-Party-ID | Remote-Party-ID | `0`/`1` — pass RPID header |
| P-Asserted-Identity | P-Asserted-Identity | `0`/`1` — pass PAI header |
| P-Preferred-Identity | P-Preferred-Identity | `0`/`1` — pass PPI header |
| From Host Part | From Host Part | Custom FROM host |
| To Host Part | To Host Part | Custom TO host |

## SIP Settings Tab

| CSV Column | OCPanel Admin UI Field | Notes |
|---|---|---|
| User Agent | User Agent | Custom User-Agent string |
| Realm | Realm | SIP authentication realm |
| Send Privacy ID | Send Privacy ID | `0`/`1` |
| Send X-OpenAPI-Call-ID | Send X-OpenAPI-Call-ID | `0`/`1` |
| User Phone | User Phone | `0`/`1` |
| 100rel | 100rel / PRACK | `0`/`1` |
| Maxptime | Maxptime | Max packetization time (e.g. `0`) |
| Support P-Early-Media | Support P-Early-Media | `0`/`1` |
| DTMF FMTP | DTMF FMTP | `0`/`1` |
| Forward the 180 (SDP) Message Following the Peer's Format | Forward 180 with SDP | `0`/`1` |
| Send 183 Message with P-Early-Media Header | Send 183 with P-Early-Media | `0`/`1` |
| Force Selected DOD in From Header | Force DOD in From Header | `0`/`1` |
| Send 302 for Inbound-to-External Forwarding | Send 302 for Forwarding | `0`/`1` |
| Support SIP REFER | Support SIP REFER | `0`/`1` |
| Allow Transfer To | Allow Transfer To | Transfer target restriction |
| Prefix | Prefix | Outbound prefix (e.g. `0-16`) |
| Use Registered Target IP for SIP Requests | Use Registered Target IP | `0`/`1` |
| Select Which IP to Use in 'Contact'(SIP) and 'Connection'(SDP)  Fields | Contact IP Selection | `default` / `internal_number` / `wan_ip` |
| IP Address | IP Address | WAN IP used when mode is IP-based |

---

## Sample Data from Export

### Row 1: ToDinstar
| Field | Value |
|---|---|
| Hostname/IP | 15.15.5.200 |
| Port | 5060 |
| Transport | udp |
| Trunk Type | peer |
| Codec Setting | ulaw&alaw&g729&g722&ilbc |
| DTMF Mode | rfc4733 |
| Qualify | 1 |
| Maximum Concurrent Calls | 0 |
| Call Restriction Type | outbound |
| Get Caller ID From | contact |
| Get DID From | follow_system |
| Contact IP Selection | default |

### Row 2: Ai-predictivedialer
| Field | Value |
|---|---|
| Hostname/IP | 127.0.0.1 |
| Port | 5060 |
| Transport | udp |
| Trunk Type | peer |
| Codec Setting | ulaw&alaw&g729 |
| DTMF Mode | rfc4733 |
| Qualify | 1 |
| Maximum Concurrent Calls | 1 |
| Call Restriction Type | outbound |
| Get Caller ID From | follow_system |
| Get DID From | follow_system |
| Contact IP Selection | internal_number |
| Prefix | 0-16 |

---

## Notes
- Boolean fields use `0` (disabled/false) and `1` (enabled/true).
- `default` values usually mean "use system default" or "inherit".
- Multi-value fields (Codecs, SIP Codes, Prefix) use `&` as delimiter.
- This mapping applies to Yeastar P550 OCPanel 37.x firmware. Field names may vary slightly across firmware versions.
