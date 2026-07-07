リクエストを送信（HTTP）
システムデザインではとあるシステムのWeb APIを設計するというお題が殆どとなっています。システムデザインにおけるネットワークリクエストについて学んでいきましょう。
HTTP
HTTP（Hypertext Transfer Protocol）は、ネットワークリクエストの最も基本的なプロトコルです。HTTPはサーバー間においてクライアントはHTTPリクエストを送信し、それをサーバー側で処理した後にHTTPレスポンスを返すとてもシンプルなモデルとなっています。
教科書的な網羅性のある解説はここではせずにシステムデザインにおいて特に重要なHTTPの要素について説明します。
HTTPリクエストとHTTPレスポンス
HTTPリクエストとHTTPレスポンス
ステートレスプロトコル
HTTPはステートレスプロトコルです。各リクエストは独立して処理されます。サーバーはリクエスト間でクライアントの状態を保持しません。この特徴を理解するのが何故システムデザインにおいて大事かというとステートレスとシステムのスケーラビリティは密接な関係があるからです。
大規模システムでは一台のサーバーでリクエストを処理する事はできません。この性質のおかげで特定のサーバーに依存することなく負荷を分散させることが可能なわけです。下の図のようにWeb Server 1とWeb Server 2にClientはリクエストを送信しますが、任意のサーバーで任意の順番でリクエストを処理する事ができるわけです。
一方でWebSocketはステートフルなプロトコルであり、HTTPに比べてスケールさせることが難しいです。
リクエストの分散に関する詳しい内容は
📗
ロードバランサーでリクエストを負荷分散
で話します。
HTTPは任意のサーバーで処理可能
HTTPは任意のサーバーで処理可能
HTTPヘッダーとCookie
先ほどHTTPはステートレスプロトコルだと言いました。にもかかわらず、我々が普段使っているWebサービスではステートフルな動作をしているように感じます。これはHTTPヘッダーとCookieについて理解する必要があります。
HTTPヘッダーは、クライアントとサーバーが送受信する情報のメタデータを含む部分です。例えば、クライアントがサーバーに対してリクエストを送る際、そのリクエストがどのような形式かContent-Typeなどが付与されています。HTTPヘッダーはリクエストとレスポンス両方に存在しますが、ここではリクエストヘッダーに関してのみ語ります。
実際のWebアプリケーションではこのHTTPヘッダーを活用して毎回誰からの情報なのかを付与しているわけです。これは皆さんも知っているであろうCookieと呼ばれる仕組みです。これにより、サーバーは各リクエストを独立していても誰からの情報かをトラックできるわけです。
Cookieは以下のような形でHTTPリクエストと共にHTTPヘッダーとして送信されます。
GET /sample_page.html HTTP/2.0
Host: www.example.org
Cookie: yummy_cookie=choco; tasty_cookie=strawberry
実際の内容を見たい場合はChrome Dev Toolsを用いると簡単に知ることができます。一部マスクして分かりにくくなっていますが、上記で説明した内容と同じ形式でHTTPヘッダー（リクエストヘッダー）として送信されていますね。
Chrome Dev Toolsのネットワークタブ
Chrome Dev Toolsのネットワークタブ
HTTPリクエストの成功と失敗
サーバーはHTTPリクエストを処理した内容をどのような結果になったかを全てのステータスコードを付与してクライアントにHTTPレスポンスとして返却する必要があります。ここではユースケースごとに何を返すべきかを考えていきます。
ここではAPIを設計する上で重要なものだけを紹介しますが、もし一覧を知りたい方がいたら以下のリソースから御覧ください
MDN Web Docs
MDN Web Docs
HTTP レスポンスステータスコード - HTTP | MDN
💡
システムデザイン面接でHTTPステータスコードまで説明する必要がある？
基本的にBigTechにおけるシステムデザイン面接でHTTPステータスコードをホワイトボードに書くことはあまりないかと思います。ここで紹介したのはいくつかのHTTPステータスコードが後の章で書く内容と関連性があるためです。
例えばシステムの耐障害性を高めるために過剰なリクエストをどのようにハンドルするという会話になったとしてレート制限を導入するとします。レート制限といえば429 Too Many Requestsを返却しシステムがそのリクエストを処理できないことを指します。
📗
大量のリクエストを制限する
で詳しく話しています。また会話の中で自然と出てくる事はあるので代表的なものは事前に把握するとよいでしょう。
リクエストが正常に処理される
通常、クライアントからのリクエストが正常に処理された場合には、HTTPステータスコード 200 OK を返します。例えば、ユーザーがブログの記事の詳細を取得するリクエストを送信した場合などが考えられます。
def get_blog_post(request): # 記事を取得するロジック
return Response(status=200, json_data=blog_post_data)
リクエストにより新しいリソースが作成される
通常、リクエストにより新しいリソースが作成された場合には、HTTPステータスコード 201 Created を返します。また、HTTPレスポンスヘッダーに Location を含め、作成されたリソースのURIを指定してあげるとよいでしょう。例えば、新しいユーザーアカウントを作成するAPIが成功した場合にこのステータスが使用されます。
def create_user_account(request): # ユーザーアカウント作成ロジック
return Response(status=201, headers={'Location': '/users/new_user_id'}, json_data=new_user_data)
リクエストを受理したがまだ処理中
リクエストを受け付けたものの、サーバー側での処理がまだ完了していない場合には、HTTPステータスコード 202 Accepted を返します。これは、非同期処理など、結果がすぐには得られない場合に適しています。このステータスを返すことで、クライアントに「リクエストは有効で、受け付けられたが、完了はまだ」ということを明示できます。通常、レスポンスには処理状況を確認できるエンドポイントや推定完了時間などを含めると親切です。
def submit_video_transcoding(request): # 動画変換ジョブをキューに追加
job_id = enqueue_transcoding_job(request.video_file)
return Response(
status=202,
json_data={'message': 'Video processing started', 'job_id': job_id}
)
ユーザーが無効なデータを送信する
ユーザーが無効なデータをリクエストに含めた場合、サーバーはHTTPステータスコード 400 Bad Request を返すべきです。例えば、必須フィールドが欠けているフォームを送信した場合や、不正な形式のデータを送信した場合などが考えられます。
def validate_user_data(request):
if not is_valid(request.data):
return Response(status=400, json_data={"error": "Invalid input data"}) # 以下で続けて処理を行う
ユーザーが認証に失敗する
ユーザーが適切な認証情報を提供できない場合、サーバーは 401 Unauthorized を返します。例えば、APIにアクセスするためのトークンが有効期限切れだった場合にこのステータスコードが使用されます。
詳しくは
📗
ユーザーを認証・認可する
でも解説します。
def access_protected_resource(request):
if not is_authenticated(request):
return Response(status=401, json_data={"error": "Authentication failed"}) # 以下で認証済みのユーザーのみ続ける
ユーザーが認可に失敗する
ユーザーがリクエストを実行する権限を持っていない場合は、サーバーは 403 Forbidden を返します。例えば、管理者権限がないユーザーが管理者専用のページにアクセスしようとした場合、このステータスコードが使用されます。
401 Unauthorizedとの違いはユーザーが誰であるかはわかっている（認証）が権限がない（認可）状態であるという事です。
詳しくは
📗
ユーザーを認証・認可する
でも解説します。
def access_admin_panel(request):
if not user_has_permission(request.user, 'admin'):
return Response(status=403, json_data={"error": "Access forbidden"}) # 以下で権限がある場合のみ続ける
クライアントが短時間で過剰なリクエストを送信する
クライアントが短期間に過剰なリクエストを送信し、レート制限に達した場合、サーバーは 429 Too Many Requests を返します。このレート制限を実装しているAPIやサービスにおいて、過負荷を防ぐために使用されます。また、HTTPレスポンスヘッダーに Retry-After ヘッダーを含めて、クライアントが次にリクエストを送信できる時間を伝えることが一般的です。
詳しくは
📗
大量のリクエストを制限する
でも解説します。
def handle_request(request):
if is_rate_limited(request):
return Response(
status=429,
headers={"Retry-After": "60"}, # 60秒後に再試行可能
json_data={"error": "Too many requests. Please try again later."}
) # リクエストを続けて処理する
サーバー側の問題でリクエストの処理に失敗する
サーバー側で問題が発生し、リクエストを処理できない場合は、500 Internal Server Error を返すべきです。例えば、データベース接続が失敗したり、未処理の例外が発生した場合に使用されます。
def process_request(request):
try: # 処理ロジック
except Exception as e:
return Response(status=500, json_data={"error": "Server error, please try again later"})

サーバー側の更新をリアルタイムに受け取る（Polling / Long Polling / SSE）
Webアプリケーションは、もともとクライアント-サーバーモデルに基づいて設計されており、クライアント側が常に発信者となってサーバーにデータをリクエストします。そのため、サーバーがクライアントからのリクエストなしにデータを送信する仕組みはこれまでありませんでした。
例えば作成したジョブの状態が完了した事をクライアントに通知したい、ChatGPTのように重い計算をサーバー側で処理している中処理できた内容を逐次送信するなどのユースケースが考えられます。この問題に関する解決策をいくつか紹介します。
HTTPポーリング
HTTPポーリングは、クライアントが一定の間隔でサーバーにリクエストを送り、最新のデータがあるかを確認する仕組みです。ポーリングには「ショートポーリング」と「 ロングポーリング」があり、ショートポーリングではクライアントが定期的にサーバーにリクエストを送り、即座にレスポンスを受け取ります。一方、 ロングポーリングでは、クライアントがリクエストを送信した後、サーバーがデータを返すまでコネクションを開いたままにしておきます。
ショートポーリングのメリットは、実装が容易であり、広く対応している点ですが、頻繁にリクエストを送ることでサーバーの負荷が増えます。
これに対し、ロングポーリングはリクエストはサーバーの状態変更に同期されるつまりサーバー側との接続を保ったまま新規レコードが来た時などに直ちにレスポンスを返す事ができるので、ショートポーリングと比べると効率的ではありますが、実装がやや複雑な事とHTTPコネクションを開きっぱなしにすることになるので、TCPポートの枯渇やファイルディスクリプタの上限に気をつけなければなりません。
注意点としてはHTTPポーリングは厳密にはサーバー側からデータを送信するというよりは定期的な問い合わせ（ショートポーリング）であったり、コネクションを長い間確立しておくことでサーバー側の変更があった時にレスポンスを返す（ロングポーリング）などの仕組みで擬似的に実現していると言ったほうが正しいでしょう。
例えば食べログノートリアルタイム更新でショートポーリングは活用されていたり、またAmazon SQSではメッセージの取り出しにショートポーリングとロングポーリングを活用しています。
Tabelog Tech Blog
Tabelog Tech Blog
食べログノートでWebSocket不要の(ほぼ)リアルタイム更新を実現した話 - Tabelog Tech Blog
Amazon Simple Queue Service
Amazon Simple Queue Service
Amazon SQSショートポーリングとロングポーリング - Amazon Simple Queue Service
ショートポーリング
notion image
クライアントサイドコード
async function pollJobStatus(jobId) {
try {
const response = await fetch(`/job-status/${jobId}`);
const data = await response.json();
console.log("Job status:", data.status);

        if (data.status === 'complete') {
            console.log("Job result:", data.result);
        } else {
            setTimeout(() => pollJobStatus(jobId), 2000); // 2秒後に再度確認
        }
    } catch (error) {
        console.error("Error:", error);
    }

}

async function createJob() {
try {
const response = await fetch('/create-job', { method: 'POST' });
const data = await response.json();
console.log("Job created with ID:", data.jobId);
pollJobStatus(data.jobId); // ジョブ作成後にポーリング開始
} catch (error) {
console.error("Error creating job:", error);
}
}

createJob(); // ジョブを作成し、ステータス確認を開始
サーバーサイドコード
const express = require('express');
const app = express();
const DB = require('./db');

app.get('/job-status/:jobId', async (req, res) => {
const jobId = req.params.jobId;
try {
const job = await DB.getJobStatus(jobId); // DBからジョブステータスを取得
if (job) {
res.json(job); // ジョブが見つかった場合
} else {
res.status(404).send('Job not found'); // ジョブが見つからない場合
}
} catch (error) {
res.status(500).send('Error fetching job status');
}
});

app.post('/create-job', async (req, res) => {
try {
const jobId = await DB.createJob(); // DBに新しいジョブを作成
setTimeout(async () => {
await DB.updateJobStatus(jobId, 'complete', 'Job successfully completed!');
}, 5000); // 5秒後にジョブが完了するシミュレーション
res.status(202).json({ jobId, status: 'in_progress' });
} catch (error) {
res.status(500).send('Error creating job');
}
});

app.listen(3000, () => console.log('Polling server running on port 3000'));
ロングポーリング
notion image
クライアントサイドコード
async function longPollJobStatus() {
try {
const response = await fetch('/job-status-long-poll');
if (response.status === 204) {
console.log('No new updates (timeout)');
longPollJobStatus(); // 再接続して次のステータス確認
} else if (response.status !== 200) {
console.error('Error occurred');
// 問題が起きているので念の為1秒後に再接続
await new Promise(resolve => setTimeout(resolve, 1000));
longPollJobStatus(); // 再接続して次のステータス確認
} else {
const data = await response.json();
console.log("Job status:", data.status);

            if (data.status === 'complete') {
                console.log("Job result:", data.result);
                return; // ジョブ完了後、ポーリング終了
            }
        }

    } catch (error) {
        console.error('Connection error:', error);
        setTimeout(longPollJobStatus, 5000); // 5秒後に再試行
    }

}

// ジョブ作成後にロングポーリングを開始
async function createJob() {
await fetch('/create-job', { method: 'POST' });
longPollJobStatus(); // ジョブ開始後にロングポーリングを開始
}

createJob(); // 初回ジョブ開始
サーバーサイドコード
const express = require('express');
const app = express();
const DB = require('./db');

app.get('/job-status-long-poll/:jobId', async (req, res) => {
const jobId = req.params.jobId;
const TIMEOUT = 30000; // タイムアウト30秒
let responded = false;

    try {
        const job = await DB.getJobStatus(jobId); // DBからジョブステータスを取得
        if (job && job.status === 'complete') {
            res.json(job); // 完了していればすぐに返す
            responded = true;
        } else {
            const checkJob = setInterval(async () => {
                const updatedJob = await DB.getJobStatus(jobId);
                if (updatedJob && updatedJob.status === 'complete' && !responded) {
                    res.json(updatedJob);
                    clearInterval(checkJob);
                    responded = true;
                }
            }, 1000); // 1秒ごとにジョブの完了を確認

            // タイムアウト処理
            setTimeout(() => {
                if (!responded) {
                    res.status(204).send(); // No Content
                    clearInterval(checkJob);
                }
            }, TIMEOUT);

            req.on('close', () => {
                if (!responded) {
                    clearInterval(checkJob);
                }
            });
        }
    } catch (error) {
        res.status(500).send('Error fetching job status');
    }

});

app.post('/create-job', async (req, res) => {
try {
const jobId = await DB.createJob(); // DBに新しいジョブを作成
setTimeout(async () => {
await DB.updateJobStatus(jobId, 'complete', 'Job successfully completed!');
}, 5000); // 5秒後にジョブが完了するシミュレーション
res.status(202).json({ jobId, status: 'in_progress' });
} catch (error) {
res.status(500).send('Error creating job');
}
});

app.listen(3000, () => console.log('Long-polling server running on port 3000'));
ショートポーリングとロングポーリングの具体的な使い分け
ショートポーリングを使う時
ショートポーリングは、リクエストの頻度が高くなるためサーバー負荷が増加するものの、クライアント側から定期的にサーバーへ問い合わせるだけで簡単に実装できます。特に、リアルタイム性がさほど求められないユースケース、例えば定期的にジョブのステータスを確認するようなシナリオに適しています。
ただし、無駄なリクエストが大量に発生するため、特にデータが少ない環境ではリソースが浪費されがちです。無駄な負荷を減らすためにはリクエストを送信する間隔を大きくすればよいのですが、それにともないリアルタイム性はなくなります。
これはトレードオフなので実際のシステムデザインでは「リアルタイム性はあまり必要がないので実装も簡単だし広い間隔でショートポーリングする」など背景情報を踏まえて提案できるとよいです。
ロングポーリングを使う時
一方、ロングポーリングでは、クライアントがサーバーにリクエストを送信した後、新しいデータが到着するまでコネクションを開いたままにします。これにより、ジョブのステータスが「完了」に変わった瞬間に即座にクライアントに通知できるため、無駄なリクエストを減らし効率的にリアルタイムの更新を実現できます。
しかし、ロングポーリングはコネクションを長時間維持するため、多数のクライアントが同時接続するとサーバーへの負荷が大きくなることがあります。また、実装もショートポーリングと比べて複雑ですので提案の際にはショートポーリングと比較してなぜロングポーリングを使うべきなのかを説明しましょう。
SSE（Sever Sent Events）
SSE（Server Sent Events）は、サーバーからクライアントに一方向でリアルタイムにデータを送信する仕組みです。SSEでは、クライアントがサーバーとの持続的な接続を開き、その接続を通じてサーバーからの更新を受け取ります。
これまで紹介したポーリングは、クライアントがサーバーに定期的にリクエストを送信して新しいデータを確認する仕組みでしたが、そのためには多くのリクエストが発生し、サーバーのリソース消費や帯域幅の無駄遣いが問題となることがあります。特に、リアルタイム性を求めるユースケースでは、ポーリングによるタイムラグや無駄なリクエストの発生が大きな課題となります。
これに対し、SSEは、サーバーが一方向にクライアントへ必要なデータを送信できるため、ポーリングのように無駄なリクエストを発生させず、効率的にリアルタイム更新が可能です。特に、ChatGPTのような連続的に複数のデータをサーバー側から送信する、LIVEフィード、ダッシュボードの更新など、常に最新のデータをクライアントに送る必要があるシナリオに適しています。実際の例をあげると、OpenAIのAPIのStreaming APIではSSEが活用されています。
SSEのメリットは、実装が比較的簡単であり、HTTPをベースにしているため多くのブラウザでサポートされていることです。しかし、SSEは一方向通信しかできないため、クライアントからサーバーへデータを送信したい場合は、ポーリングやWebSocketなどを組み合わせる必要があります。WebSocketは
📗
リアルタイム双方向通信（WebSocket）
で解説しているので合わせて見てください。
MDN Web Docs
MDN Web Docs
サーバー送信イベントの使用 - Web API | MDN
notion image
クライアントサイドコード
function startChat(userMessage) {
const eventSource = new EventSource(`/chat?message=${encodeURIComponent(userMessage)}`);

    eventSource.onmessage = (event) => {
        if (event.data === "[END OF CONVERSATION]") {
            console.log("Conversation ended.");
            eventSource.close();
        } else {
            console.log("Received:", event.data); // 受信したメッセージを表示
        }
    };

    eventSource.onerror = (error) => {
        console.error("Error occurred:", error);
        eventSource.close();
    };

}

// ユーザーからの入力に基づいてチャットを開始
startChat("Hello, how are you?");
サーバーサイドコード
const express = require('express');
const app = express();
const messageGenerator = require('./messageGenerator'); // メッセージ生成モジュール

app.get('/chat', (req, res) => {
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.flushHeaders(); // 初期ヘッダを送信

    const userMessage = req.query.message || ''; // クエリパラメータからユーザーのメッセージを取得

    // ユーザーのプロンプトをもとにメッセージを逐次的に生成
    const messageStream = messageGenerator(userMessage);

    // メッセージを定期的に送信
    const intervalId = setInterval(() => {
        const nextMessage = messageStream.next(); // メッセージを一つずつ取得
        if (nextMessage.done) {
            res.write(`data: [END OF CONVERSATION]\n\n`); // 終了メッセージ
            clearInterval(intervalId);
            res.end(); // コネクションを終了
        } else {
            res.write(`data: ${nextMessage.value}\n\n`); // メッセージを送信
        }
    }, 1000); // 1秒ごとにメッセージを送信

    // クライアントが接続を切ったら送信を停止
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });

});

app.listen(3000, () => console.log('Chat SSE server running on port 3000'));

リアルタイム双方向通信（WebSocket）
ポーリングは
📗
サーバー側の更新をリアルタイムに受け取る（Polling / Long Polling / SSE）
として使われていますが、今度はリアルタイムの双方向通信について考えていきましょう。よく活用される技術としてはWebSocketがあげられます。WebSocketはクライアントとサーバー間で双方向のデータ通信を可能にし、一度コネクションが確立されると、継続的にデータを送受信できるようになります。このため、クライアントとサーバーの間で頻繁にデータをやり取りするリアルタイム性の高いアプリケーションに非常に適しています。
よく活用されるユースケースとしてはリアルタイムのチャットアプリケーションなどのシステムデザインでよく使われます。
WebSocketとは
WebSocketプロトコルは、クライアントとサーバー間で低遅延かつ双方向の通信を確立する仕組みです。これは通常のHTTP通信とは異なり、1回のハンドシェイク後にコネクションが継続的に開かれ、その後は両者がメッセージを送信し続けることができます。
WebSocketの利点
双方向通信: HTTPのリクエスト/レスポンスモデルを超えた、継続的な双方向通信
サーバー負荷低減: 継続的なコネクションを保持するので、ポーリングやSSEと比べてサーバーへの負荷を軽減できる
ネットワーク効率: 従来のHTTPより少ないオーバーヘッドで通信可能（各フレームに追加されるオーバーヘッドは比較的少なく、2～14バイトでHTTPに比べ遥かに小さい）
参考 -
O'Reilly
O'Reilly
Browser APIs and Protocols: WebSocket - High Performance Browser Networking (O'Reilly)
WebSocketのスケールアウト
一方で、コネクションの維持が重要となるため、接続数が非常に多くなるとサーバーのスケーラビリティの工夫が必要です。詳細は
📗
ステートフル接続に対してスケーラブルな設計を行う
に書いているので、ぜひご覧下さい。
活用例
WebSocketはLINE LIVE チャット機能で活用されていたり、DeNAのPocochaではbcsvrという内製のWebSocketサーバーが使われています。
LINE ENGINGEERING
LINE ENGINGEERING
LINE LIVE チャット機能を支えるアーキテクチャ
Speaker Deck
Speaker Deck
Pocochaを支えるバックエンド 〜アーキテクチャとDBシャーディング〜【DeNA TechCon 2021】/techcon2021-3
💡
WebSocketはステートフルなプロトコルである
WebSocketはHTTPとは異なるステートフルなプロトコルであることはシステムデザインにおける重要な要素です。HTTPのステートレスは設計をシンプルにし、さらにスケーラブルなシステム構築にも適しています。
なのでシステムデザインの面接では何も考えずに提案するのではなく、このデメリットを享受していても実現したい要件、例えば高いリアルタイム性と双方向通信この2つのキーワードがある場合はオススメです。
また提案する際にはHTTPポーリングとの比較も行っておくとよいです。システムデザインに正解はありません。提案の際はメリットとデメリットが必ず存在するので背景を踏まえて提案していきましょう。
WebSocketのコネクション確立について
WebSocketのコネクションは、最初にクライアントからサーバーへのHTTPリクエスト（WebSocketハンドシェイク）を使用して確立されます。このリクエストは通常のHTTPと同じ形式で始まりますが、Upgradeヘッダーにより、WebSocketプロトコルに切り替わることを示します。
具体的には以下のようなHTTPリクエストが送信されます。
GET /socket HTTP/1.1
Host: interviewcat.io
Connection: keep-alive, upgrade
Upgrade: websocket
Sec-WebSocket-Key: N509hQQwsFGf22hkxP3F6g==
Sec-WebSocket-Version: 13
例えばDiscordを通信内容を見るとこのプロトコルの切り替え（101 Switching Protocols）が行われていることが分かります。
HTTPの101 Switching Protocols
HTTPの101 Switching Protocols
サーバーがこれを認識すると、HTTPプロトコルからWebSocketプロトコルに移行し、コネクションが確立されます。この時点で、クライアントとサーバーは双方向通信が可能となりリアルタイムにメッセージを送受信できます。
WebSocketのサンプルコード
notion image
クライアントサイドコード
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
console.log('Connected to chat server');
};

ws.onmessage = (event) => {
const data = JSON.parse(event.data);

    if (data.type === 'history') {
        console.log("Chat history:", data.messages);
        data.messages.forEach(msg => displayMessage(msg)); // 履歴を表示
    }

    if (data.type === 'message') {
        console.log("New message:", data.message);
        displayMessage(data.message); // 新しいメッセージを表示
    }

};

ws.onclose = () => {
console.log('Disconnected from chat server');
};

ws.onerror = (error) => {
console.error('WebSocket error:', error);
};

// メッセージ送信関数
function sendMessage(text) {
const message = { text, timestamp: new Date().toISOString(), sender: 'User' };
ws.send(JSON.stringify(message));
}

// メッセージ表示関数（DOMへの表示処理）
function displayMessage(message) {
// 省略
}

// ユーザーがメッセージを入力し、送信する処理
sendMessage('Hello')
サーバーサイドコード
const WebSocket = require('ws');
const DB = require('./db'); // 仮想のデータベースインターフェース

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', ws => {
console.log('Client connected');

    // 過去のチャット履歴を取得して送信
    DB.getChatHistory().then(history => {
        ws.send(JSON.stringify({ type: 'history', messages: history }));
    });

    // メッセージを受信した際の処理
    ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message);

        // メッセージをデータベースに保存
        const savedMessage = await DB.saveMessage(parsedMessage);

        // 接続しているすべてのクライアントに新しいメッセージを送信
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'message', message: savedMessage }));
            }
        });
    });

    // クライアントが切断された際の処理
    ws.on('close', () => {
        console.log('Client disconnected');
    });

});

console.log('WebSocket server running on port 3000');

サービス間通信の設計
近年、マイクロサービスアーキテクチャの普及により、多数の独立したサービスが緩やかに結合する大規模な分散システムが一般的になりました。単一の巨大なモノリシックシステムとは異なり、マイクロサービス間の通信はネットワークを介した通信が増え、より高度な設計が求められます。ここでは、同期通信と非同期通信の2つのサービス間通信を整理し、それぞれの特性、利点・欠点、適用場面を考察します。
同期通信
同期通信は、呼び出し元が応答を待ってから次の処理に進むもので、RESTがもっともよく使われる手法ですが、HTTP/2上でバイナリプロトコルを用いるgRPCもマイクロサービス間の通信では一般的に利用されます。
同期通信は非常にシンプルです。例えばリアクションサービス（Reaction Service）が通知サービス（Notification Service）を呼び出す際、ユーザーが「いいね」を押す操作からデータベース更新、そして通知サービスへのAPI呼び出し、レスポンスを受け取ってからユーザーへ応答を返すまで、一通りの流れとして理解しやすくなっています。
シンプルで即時性や明確な成功・失敗のフィードバックが求められる場面に適しています。一方で、通知サービスのAPIが遅延したり、障害を起こしたりすると、呼び出し元の処理がブロックされ、クライアント側は待たされることになります。
さらには、複数のサービスがチェーン上に連鎖し、どれかが不調に陥ると芋づる式に全体が遅れ、結果的にカスケード障害が発生する可能性があります。ここにリクエストのリトライも重なると目も当てられない自体になります。詳しくは
📗
リクエストのリトライ設計について
と
📗
サーキットブレーカーでリトライによる過負荷を防ぐ
で解説します。
また、このような同期的呼び出しはサービス同士の結合度を強め、互いのAPI仕様変更やバージョン管理に対して強く依存します。
notion image
💡
gRPCとは
gRPCは、Googleが開発した高速かつ効率的なRPC（Remote Procedure Call）フレームワークです。HTTP/2とProtocol Buffersを活用することで、従来のREST＋JSONに比べデータ伝送量やレイテンシを削減しつつ、明確なインターフェース定義による型安全なサービス間通信を可能にします。これにより、マイクロサービスや分散システムにおいて、高パフォーマンスな通信を実現できます。例えばメルカリではマイクロサービスの通信手法でgRPCを活用しています

gRPCを用いたマイクロサービスのAPI仕様の記述 | メルカリエンジニアリング
。
しかしシステムデザインで自身の経験的にgRPCについて深く語ることができない場合はRESTで置き換えて話しても構いません。知識の広さをアピールする上で少しくらい触れるのは問題ありませんが、自分は経験がないのでRESTで話を進めますと言ったほうが安全です。
非同期通信
即座に結果が必要ない場合は非同期通信を検討しましょう。そこではメッセージキューを導入する事でサービス間の疎結合化、信頼性、スケーラビリティを高める事ができます。
例えば、通知サービスが過負荷により一時的にレスポンスが遅れている場合を考えましょう。同期的通信であれば、ユーザーリクエスト全体が遅延してしまいます。しかし、非同期通信であれば、メッセージキューを間に挟むことで、結果を待たずに処理を進める事ができます。
notion image
代表的なメッセージキューといえばKafka、RabbitMQ、Redis Streamsなどが挙げられます。またクラウドサービスではGoogle Pub/Sub、Amazon SQSなど活用する事もできます。厳密に言えば、Kafkaはイベントストリーミングプラットフォームであり、メッセージキューではありませんが、メッセージキュー（RabbitMQなど）とイベントストリーミングプラットフォーム（Kafkaなど）の区別は曖昧になっており、用語のブレをなくすためにこの本ではメッセージキューと呼称していきます。
例えば、LINEではメッセージ配信基盤でメッセージキューとしてRedis Streamsを活用しています。
LINE ENGINGEERING
LINE ENGINGEERING
同時接続数30万超のチャットサービスのメッセージ配信基盤をRedis Pub/SubからRedis Streamsにした話
Yahoo!ショッピングの例ではレコメンド商品の要求がある度に同期的にレコメンド商品を計算していたものを、メッセージキューを活用して推論処理を非同期的処理しています。
Yahoo! JAPAN Tech Blog
Yahoo! JAPAN Tech Blog
大規模レコメンドシステムの構築とレイテンシ改善 〜 Yahoo!ショッピングの事例
ただし、非同期通信にはソーシャルネットワーキングサービスの通知などの即時に届かなくても問題ないシナリオでは有効ですが、例えば金融取引など、結果の確定が即時性を要するケースでは不向きです。
非同期通信の結果の確認
ポーリングによる結果の確認
クライアントがバックエンドに対して一定間隔でリクエストを送信し、処理結果が準備できているかどうかを確認する手法です。クライアントが定期的にバックエンドを問い合わせて、DB等からタスクの進捗や結果を取得します。
ポーリングではリクエストの間隔を小さくして頻繁に問い合わせる場合はサーバー負荷に関して注意してください。また、ポーリングに関して詳しく知りたい場合は
📗
サーバー側の更新をリアルタイムに受け取る（Polling / Long Polling / SSE）
でも話しているので参照してください。
notion image

システムデザイン面接ではどのようにサービス間通信を使い分ける？
同期通信を基本とする
面接では「基本的には同期通信を選択し、特定の条件が揃った場合に非同期通信を検討する」というアプローチを示しましょう。同期通信はシンプルで理解しやすく、リクエスト失敗時の処理やデバッグが容易であるため、最初の設計では同期通信から始めることを説明します。
非同期通信を選ぶ条件
一方で、特定の条件が揃った場合は非同期通信を検討します。最も重要な判断基準は処理時間の長さです。
時間がかかる処理
処理に数秒以上かかる場合は、非同期通信を第一に検討しましょう。例えば、動画のエンコード処理、大量データの分析、機械学習モデルの推論などは、完了まで数分から数時間かかることがあります。これらの処理でユーザーを待たせるのは現実的ではありません。
具体例として、YouTubeのような動画共有サービスでは、動画のアップロード後に複数の解像度でのエンコード処理が必要ですが、これは数分から数十分かかる可能性があります。ユーザーは動画をアップロードした時点で次の作業に移れるよう、エンコード処理は非同期で実行し、完了時に通知する設計が適切です。
遅延が許容される処理
結果の即時性が重要でない処理も非同期通信の候補です。例えば、メール送信、プッシュ通知などは、数秒から数分の遅延があってもユーザー体験に大きな影響を与えません。また、ログの収集などユーザーに関係のない処理も同期を取る必要がなく遅延が許容されます。
例えば、SNSで「いいね」を押した際、カウントの更新は即座に反映されるべきですが、「いいね」を押されたユーザーへのプッシュ通知は数秒遅れても問題ありません。このような場合、メイン機能は同期的に処理し、付随する通知処理は非同期で実行する設計が効果的です。

Pub/Subで複数のサービスにメッセージ配信
複数のサービスにメッセージをブロードキャストするファンアウト（Fan-out）について解説します。ファンアウトを活用することで解決する問題、どのようなユースケースで活用できるのかを見ていきましょう。
Pub/Subモデルとは？
Pub/Sub（パブリッシュ・サブスクライブ）モデルは、より柔軟にサービス間の非同期通信を実現します。このモデルでは、Publisher（メッセージを発信する側）がトピックにメッセージを送信すると、Subscriber（受信する側）はそのメッセージを自動的に受け取ります。このため、発信者と受信者はお互いの存在を気にする必要がなく、システム全体の設計がシンプルになります。
例えば、ユーザーがSNSに写真付きで投稿すると、投稿サービスが「post-events」トピックに投稿データを送信します。このメッセージを受信した画像処理サービス（サムネイル生成・リサイズ）、通知サービス（フォロワーへのプッシュ通知）、タイムライン更新サービス（フォロワーのタイムラインに追加）、検索インデックスサービス（投稿内容をインデックス化）が同時に処理を開始します。
Pub/Subモデル
Pub/Subモデル
例えばAmazon SNSやGoogle Pub/SubはPub/Subを実現するクラウドサービスの代表例です。また、Redis Pub/SubやKafkaなどでもPub/Subを実現する事はできます。
ファンアウト（Fan-out）の仕組みと利点
ファンアウト（Fan-out）とは、1対多で1つのソースから複数のターゲットにメッセージを配信する設計パターンの事を指します。このパターンを用いる事で複数のサービスにメッセージをブロードキャストする事ができます。ちなみに多対1はファンイン（Fan-in）と言います。
ファンアウトは先に紹介したPub/Subを用いて実装する事ができます。Subscriberの数を増やす事で容易に1対多のメッセージ配信が可能になるわけです。
さらにファンアウトはサービス間の疎結合、拡張性にも優れた設計になります。
サービス間が疎結合になることでシステムの各コンポーネントが互いに独立して動作できるため、障害が一部に発生しても全体に影響が及びにくくなります。
また拡張性も高く、例えば、注文確定のメッセージが以下のように複数のサービスへ伝播するような場合で
在庫管理システム
請求処理サービス
顧客への通知配信
に同時にメッセージを配信する事ができます。サービスが仮に一つ増えたとしてもSubscriberとして追加するだけで他のサービスを変更する必要はありません。
notion image
💡
Fan-out on Write vs Fan-out on Read
ファンアウトの話になると、よく登場するのが「Fan-out on Write」と「Fan-out on Read」という2つの設計アプローチです。どちらも同じデータを複数のクライアントやサービスへ届けるための設計ですが、“いつ”“どこで”ファンアウトするのかという視点で大きく異なります。
Fan-out on Writeは書き込み時に分散させる方針です。例えば、SNSで誰かが投稿したとき、その投稿内容をフォロワー全員の「フィード」テーブルに事前に書き込むような形です。つまり書いた瞬間に全員分の処理が発生します。
Fan-out on Readは読み込みのタイミングで対象データを動的に集約して返す方式です。フィードを開くときに「自分がフォローしている人の投稿を動的に検索して表示」します。
Fan-out on Writeは書き込み先が多い時が問題になります。X（Twitter）では過去タイムライン作成にFan-out on Writeがまず活用されていましたがレディー・ガガのようなフォロワーが数多くいるようなユーザーに対しては使わない選択を取ったようです。
InfoQ
InfoQ
Timelines at Scale
