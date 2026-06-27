#!/usr/bin/env python3
import os
import json
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import email.utils
from datetime import datetime, timezone, timedelta
import subprocess


# List of RSS feeds to aggregate raw news from
FEEDS = {
    "World": [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en"
    ],
    "India": [
        "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en",
        "https://timesofindia.indiatimes.com/rssfeeds/296589.cms"
    ],
    "Business": [
        "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
        "https://feeds.bbci.co.uk/news/business/rss.xml"
    ],
    "Technology": [
        "https://techcrunch.com/feed/",
        "https://feeds.bbci.co.uk/news/technology/rss.xml"
    ],
    "Science": [
        "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
        "https://www.nature.com/nature.xml"
    ],
    "Sports": [
        "https://www.espn.com/espn/rss/news",
        "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en"
    ],
    "Entertainment": [
        "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en"
    ]
}

# High-quality fallback seed data for June 27, 2026
SEED_STORIES = [
    {
        "rank": 1,
        "title": "Strikes in the Strait: US Hits Targets in Iran After Shipping Attacks",
        "category": "World",
        "excerpt": "In a sharp escalation of Middle East tensions, the US military launched strikes inside Iran, targeting missile and drone sites following a shipping attack.",
        "content": "The US military launched precision airstrikes inside Iran, targeting radar installations and storage facilities for drones and missiles in a sharp escalation of Middle East tensions.\n\nThe strikes were a direct response to a drone attack on a commercial shipping vessel in the Strait of Hormuz, following a series of shipping disruptions that threatened global trade lanes.\n\nThe Strait of Hormuz handles a fifth of the world's daily petroleum shipments; closures or high insurance rates instantly spike global oil prices and feed inflation.\n\nDiplomatic channels are working to prevent a full-scale blockade, while energy markets watch for retaliation or a container transit halt.",
        "source_url": "https://www.reuters.com/world/middle-east/",
        "read_time": 2,
        "why_this_matters": "A direct military exchange in the Strait of Hormuz threatens the transit of a fifth of global petroleum supply, exposing energy markets to immediate inflation shocks."
    },
    {
        "rank": 2,
        "title": "A Path for Peace: Israel and Lebanon Sign Historic Framework Deal",
        "category": "World",
        "excerpt": "Lebanon and Israel have signed a US-brokered framework agreement in Washington, aiming to end decades of cross-border conflict.",
        "content": "Lebanon and Israel signed a US-brokered border agreement in Washington, establishing a framework to halt decades of cross-border hostilities.\n\nFive rounds of intense closed-door negotiations culminated in this agreement, driven by Lebanon's deep economic crisis and Israel's strategic priority to secure its northern border.\n\nThis represents the most significant diplomatic peace deal between the neighbors in a generation, providing a structured security corridor monitored by international forces.\n\nTroops must transition to the demilitarized buffer zone, and international observers will watch if local factions try to derail the truce.",
        "source_url": "https://www.bbc.com/news/world-middle-east",
        "read_time": 2,
        "why_this_matters": "This framework agreement is the most significant step towards peace between the two neighbors in a generation, establishing a structured channel to de-escalate border tensions."
    },
    {
        "rank": 3,
        "title": "Operation Amistad: India Flies Relief to Earthquake-Stricken Venezuela",
        "category": "India",
        "excerpt": "India has launched a major humanitarian mission, dispatching IAF aircraft laden with search-and-rescue teams and medical aid to Venezuela.",
        "content": "India dispatched transport aircraft loaded with emergency search-and-rescue teams, mobile field hospitals, and relief supplies to Venezuela.\n\nA catastrophic 7.1 magnitude earthquake devastated the northern Venezuelan coastline, claiming over 900 lives and overwhelming local emergency systems.\n\nThe operation showcases India's growing capacity to project heavy logistics and disaster aid across continents, marking its role as a responsible global first responder.\n\nRescue workers will begin clearing concrete debris in the hardest-hit zones, transitioning to medical triage to prevent the outbreak of disease.",
        "source_url": "https://www.mea.gov.in/",
        "read_time": 2,
        "why_this_matters": "This mission highlights India's growing capacity and willingness to act as a first responder in global humanitarian crises, extending its soft power and logistical reach."
    },
    {
        "rank": 4,
        "title": "Miracle in Munich: Ecuador Beats Germany in World Cup Shock",
        "category": "Sports",
        "excerpt": "Ecuador pulled off one of the greatest upsets in football history, defeating Germany to qualify for the FIFA World Cup knockout stages.",
        "content": "Ecuador pulled off a historic upset at the FIFA World Cup, defeating four-time champions Germany 2-1 to qualify for the knockout stages.\n\nEcuador fell behind early but secured the winning goal in the 88th minute of the final group stage match, triggering massive celebrations and a national holiday in Ecuador.\n\nThis David-and-Goliath victory disrupts the tournament seedings and demonstrates that structured teamwork and intense passion can defeat multi-million dollar squad values.\n\nEcuador moves into the Round of 16 with massive competitive momentum, while the German national team faces a painful administrative post-mortem.",
        "source_url": "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup",
        "read_time": 2,
        "why_this_matters": "This classic underdog victory disrupts the tournament seedings and proves that competitive passion and tactical discipline can overcome multi-million-dollar squad values."
    },
    {
        "rank": 5,
        "title": "Cricket Shock: Ireland Stuns India in T20 Opener",
        "category": "Sports",
        "excerpt": "Ireland’s men's cricket team made history by securing a comprehensive 34-run victory over a full-strength Indian side.",
        "content": "Ireland's men's cricket team secured a comprehensive 34-run victory over the top-ranked Indian side in Dublin.\n\nAggressive Irish batting set a high target, which was successfully defended by bowlers who suffocated the world's most lucrative batting lineup.\n\nIndia is the financial powerhouse of global cricket; Ireland's win on a fraction of the budget proves that emerging nations are closing the competitive gap in T20 cricket.\n\nIndia will look to recover in the remaining series matches, while Ireland gains critical ranking points and leverage for upcoming tournaments.",
        "source_url": "https://www.cricketireland.ie/",
        "read_time": 2,
        "why_this_matters": "This victory demonstrates how the compressed T20 format is narrowing the gap between emerging teams and established giants, driving cricket's global competitive balance."
    },
    {
        "rank": 6,
        "title": "Closing the Deal: US and India Near Historic Trade Agreement",
        "category": "Business",
        "excerpt": "US Secretary of State Marco Rubio indicated that a major US-India trade deal is close to completion, ahead of a planned presidential visit.",
        "content": "The United States and India are nearing a comprehensive bilateral trade agreement, set to be finalized during an upcoming diplomatic visit.\n\nYears of tariff negotiations are concluding as both nations seek to reduce their industrial and manufacturing dependence on Chinese supply chains.\n\nLowering trade barriers could push bilateral trade past $300 billion annually, easing operations for Indian tech firms and US manufacturing investments.\n\nNegotiators will finalize the text before a proposed presidential state visit, preceding legislative approvals in both countries.",
        "source_url": "https://www.ustr.gov/",
        "read_time": 2,
        "why_this_matters": "A completed trade deal would permanently integrate the supply chains of both nations, accelerating their strategic decoupling from Chinese manufacturing."
    },
    {
        "rank": 7,
        "title": "Silicon Privacy: Apple’s New Chip Runs AI Locally Without the Cloud",
        "category": "Technology",
        "excerpt": "In a major privacy play, Apple’s latest M-series chips are designed to run complex generative AI models directly on your device, bypassing the cloud entirely.",
        "content": "Apple announced new local processing chips designed to run generative AI models directly on user devices without sending data to cloud servers.\n\nPublic concern over AI privacy and server costs has grown, prompting developers to compress models using quantization so they run efficiently on consumer hardware.\n\nMoving processing locally protects personal user data from corporate servers and remote hackers, while enabling AI features to run offline in airplane mode.\n\nCompetitors will race to match offline hardware capabilities, shifting the tech landscape from centralized cloud subscriptions to local utilities.",
        "source_url": "https://www.apple.com/newsroom/",
        "read_time": 2,
        "why_this_matters": "By proving that generative AI can run locally on mobile hardware, this shift cuts dependence on massive cloud networks and establishes privacy as a core design principle."
    },
    {
        "rank": 8,
        "title": "Earthquakes in Venezuela: Rescue Teams Race Against the Clock",
        "category": "World",
        "excerpt": "A series of powerful earthquakes has devastated Venezuela’s northern coast, leaving over 900 dead and triggering an international rescue effort.",
        "content": "A series of powerful earthquakes struck Venezuela's northern coast, claiming over 900 lives and destroying local coastal towns.\n\nActive movement along the Caribbean-South American tectonic plate triggered the 7.1 magnitude quake, worsened by aging structural infrastructure.\n\nThe destruction has triggered a major humanitarian relief crisis, testing international disaster coordination across opposing geopolitical blocs.\n\nSpecialized search teams are scanning collapsed rubble using sniffer dogs, while aid groups prepare temporary shelter and clean water logistics.",
        "source_url": "https://www.un.org/en/play-section",
        "read_time": 2,
        "why_this_matters": "This disaster highlights the critical need for global climate and structural disaster cooperation, testing international coordination across geopolitical blocs."
    },
    {
        "rank": 9,
        "title": "Streaming Records Broken: World Cup Draws Historic Digital Audience",
        "category": "Entertainment",
        "excerpt": "The ongoing FIFA World Cup in North America is shattering all previous records for live digital streaming viewership.",
        "content": "The FIFA World Cup in North America has broken global records for live digital streaming viewership, drawing hundreds of millions of concurrent online viewers.\n\nMajor matches drew unprecedented traffic due to mature global broadband infrastructure and a consumer shift away from traditional cable television.\n\nThis milestone makes live sports the ultimate growth driver for streaming platforms, prompting tech companies to spend billions on exclusive broadcast rights.\n\nBroadcasters will bid aggressively on future olympic and league contracts, forcing traditional networks to reconsider their sports models.",
        "source_url": "https://www.fifa.com/",
        "read_time": 2,
        "why_this_matters": "This record shift proves that live sports broadcast rights are now the primary driver of subscription growth, fundamentally reshaping the economics of media platforms."
    },
    {
        "rank": 10,
        "title": "Fusion Energy Record: A New Milestone for Limitless Clean Power",
        "category": "Science",
        "excerpt": "Scientists have sustained a nuclear fusion reaction at extreme temperatures for a record duration, bringing clean energy closer to reality.",
        "content": "International scientists successfully sustained a nuclear fusion reaction at 100 million degrees Celsius for a record-breaking duration.\n\nResearchers used advanced neural network models to predict and adjust magnetic fields in real-time, preventing the turbulent plasma from cooling against reactor walls.\n\nNuclear fusion promises carbon-free, limitless clean energy without long-lived waste; controlling plasma instabilities moves the technology from physics to engineering.\n\nThe research team will share their telemetry with the ITER reactor project in France, guiding the development of heat-resistant commercial containment.",
        "source_url": "https://www.iter.org/",
        "read_time": 2,
        "why_this_matters": "Controlling the extreme instabilities of fusion plasma using artificial intelligence takes us from theoretical physics to practical engineering, bringing clean energy closer to reality."
    }
]

def parse_pub_date(pub_date_str):
    """Parses standard RSS date string into timezone-aware datetime."""
    try:
        return email.utils.parsedate_to_datetime(pub_date_str)
    except Exception:
        return None

def fetch_rss_feeds(lookback_hours=48):
    """Fetches titles and links from configure RSS feeds to feed to Gemini API."""
    print(f"Aggregating raw news data from RSS feeds (last {lookback_hours} hours)...")
    aggregated_data = []
    
    now_tz = datetime.now(timezone.utc)
    max_age = timedelta(hours=lookback_hours)
    
    # We will fetch a subset of items to avoid hitting token limits
    for category, urls in FEEDS.items():
        for url in urls:
            try:
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 BrieflyNews/1.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    xml_data = response.read()
                    root = ET.fromstring(xml_data)
                    
                    count = 0
                    for item in root.findall('.//item'):
                        if count >= 10:  # Limit per feed
                            break
                        
                        pub_date = item.find('pubDate')
                        pub_date_text = pub_date.text if pub_date is not None else ""
                        
                        # Apply date filter: Skip articles older than 48 hours to prevent stale news
                        if pub_date_text:
                            dt = parse_pub_date(pub_date_text)
                            if dt:
                                age = now_tz - dt
                                if age > max_age:
                                    continue
                        
                        title = item.find('title')
                        link = item.find('link')
                        description = item.find('description')
                        
                        title_text = title.text if title is not None else ""
                        link_text = link.text if link is not None else ""
                        desc_text = description.text if description is not None else ""
                        
                        aggregated_data.append({
                            "category": category,
                            "title": title_text,
                            "link": link_text,
                            "description": desc_text,
                            "date": pub_date_text
                        })
                        count += 1
            except Exception as e:
                print(f"Skipping feed {url} due to error: {e}")
                
    return aggregated_data

def generate_with_gemini(api_key, raw_news):
    """Uses Gemini API to curate, rank and write the 10 daily stories with model fallback."""
    models_to_try = [
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest"
    ]
    
    prompt = f"""
You are "briefly", a refined, intelligent, and confident news editor.
Analyze the following raw news articles gathered from RSS feeds over the past 24 hours.
Select exactly 10 most globally important or interesting stories.
For each selected story, write a fully original, concise summary following these strict guidelines.

Guidelines for EACH article:
1. STRUCTURE: Each article MUST contain exactly four paragraphs. Each paragraph answers one of these questions in this exact order:
   - Paragraph 1: What happened? (A clear, objective summary of the event)
   - Paragraph 2: Why now? (The immediate triggers, historical context, or recent developments leading to this)
   - Paragraph 3: Why does it matter? (The broader implications, systemic impact, or why it matters to the reader)
   - Paragraph 4: What's next? (Upcoming decisions, milestones, or expected consequences)
   Do NOT output paragraph labels like "What happened:". Just output the raw paragraphs separated by double newlines (\\n\\n).
2. TONE & VOICE: Intelligent, confident, simple, and warm, with occasional light wit. Read like an experienced editor explaining the world. Avoid AI cliches, sensational adjectives, and corporate speak.
3. WORD COUNT: Keep each paragraph concise (2-4 sentences). Total length should be around 180-250 words to avoid overwhelmed readers and leave them slightly curious.
4. LINKS: Set 'source_url' to the actual URL of the article from the feed so readers can look deeper.
5. RATING: Rate 'read_time' in minutes (estimated at ~120 words per minute, so 180-250 words should be exactly 2 minutes).
6. WHY IT MATTERS: Set 'why_this_matters' to a concise, single-sentence summary explaining why this story deserves editorial attention.

Raw News Data:
{json.dumps(raw_news[:80])} # limit to top 80 items to stay safe on context limit
"""

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "stories": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "rank": { "type": "INTEGER", "description": "Rank from 1 (most important) to 10" },
                                "title": { "type": "STRING", "description": "Compelling, clean headline (no clickbait)" },
                                "category": { "type": "STRING", "enum": ["World", "India", "Business", "Technology", "Science", "Sports", "Entertainment"] },
                                "excerpt": { "type": "STRING", "description": "A crisp, engaging 1-2 sentence preview" },
                                "content": { "type": "STRING", "description": "The full 300-500 word article text, with paragraphs separated by double newlines (\\n\\n)" },
                                "source_url": { "type": "STRING", "description": "The URL linking to the original source" },
                                "read_time": { "type": "INTEGER", "description": "Estimated reading time in minutes (2 to 4)" },
                                "why_this_matters": { "type": "STRING", "description": "A single, concise, editorial sentence explaining why this story matters." }
                            },
                            "required": ["rank", "title", "category", "excerpt", "content", "source_url", "read_time", "why_this_matters"]
                        }
                    }
                },
                "required": ["stories"]
            }
        }
    }
    
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        print(f"Calling Gemini API using model '{model}'...")
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                content_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(content_text)
        except urllib.error.HTTPError as e:
            print(f"HTTP Error calling Gemini API with {model}: {e.code} {e.reason}")
            try:
                error_body = e.read().decode("utf-8")
                print("Response body:", error_body)
            except:
                pass
            print(f"Retrying with next model fallback...")
        except Exception as e:
            print(f"Error calling Gemini API with {model}: {e}")
            print(f"Retrying with next model fallback...")
            
    return None

def load_env():
    """Manually parses a local .env file and sets environment variables."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip().strip('"').strip("'")

def git_push_changes(file_path):
    auto_push = os.environ.get("AUTO_PUSH_TO_GITHUB", "false").lower() == "true"
    if not auto_push:
        return
        
    print("AUTO_PUSH_TO_GITHUB is enabled. Preparing to commit and push changes...")
    try:
        # Check if git is initialized
        work_dir = os.path.dirname(os.path.abspath(__file__))
        git_dir = os.path.join(work_dir, ".git")
        if not os.path.exists(git_dir):
            print("Warning: Local directory is not a git repository. Skipping push.")
            return

        # Add stories.json
        subprocess.run(["git", "add", file_path], check=True, cwd=work_dir)
        
        # Check if there is anything to commit
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, check=True, cwd=work_dir)
        if not status.stdout.strip():
            print("No changes to commit in stories.json.")
            return
            
        # Commit changes
        subprocess.run(["git", "commit", "-m", "Daily news update [skip ci]"], check=True, cwd=work_dir)
        
        # Push changes to remote origin on main branch
        subprocess.run(["git", "push", "origin", "main"], check=True, cwd=work_dir)
        print("Successfully pushed latest news updates to GitHub!")
    except Exception as e:
        print(f"Error executing auto git push: {e}")

def main():
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Parse lookback hours config
    try:
        lookback_hours = int(os.environ.get("LOOKBACK_HOURS", "48"))
    except ValueError:
        lookback_hours = 48

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "stories.json")
    
    # Metadata for the update
    now = datetime.utcnow()
    last_updated_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    stories_data = None
    
    if api_key and api_key != "your_gemini_api_key_here":
        print("Gemini API key found. Fetching raw news and preparing update...")
        raw_news = fetch_rss_feeds(lookback_hours=lookback_hours)
        if raw_news:
            stories_data = generate_with_gemini(api_key, raw_news)
        else:
            print("Failed to fetch raw news feeds. Using high-quality seed stories.")
    else:
        print("No active GEMINI_API_KEY environment variable or config found. Initializing with pre-seeded high-quality stories.")
    
    # Fallback to seed stories if generation failed or no API key
    if not stories_data:
        print("Writing seeded stories to data/stories.json...")
        stories_data = {"stories": SEED_STORIES}
        
    # Inject dynamic metadata
    stories_data["last_updated"] = last_updated_str
    
    # Write to target JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stories_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully updated stories. Saved to {output_path}")
    
    # Run git auto push if enabled
    git_push_changes(output_path)

if __name__ == "__main__":
    main()
