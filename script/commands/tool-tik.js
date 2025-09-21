const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "تيك",
  version: "1.0.0",
  hasPermssion: "0",
  credits: "Kim Joseph DG Bien - Modified",
  description: "قم بالبحث عن فيديو في التيك توك",
  commandCategory: "وسائط",
  usage: "[تيك <إسم البحث>]",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  try {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      api.sendMessage("📋 | الإستخدام: تيك <نص البحث>", event.threadID);
      return;
    }

    const initialMessageID = await new Promise((resolve) =>
      api.sendMessage("⏱️ | جاري البحث المرجو الإنتظار...", event.threadID, (err, info) => {
        if (info) resolve(info.messageID);
      })
    );

    const response = await axios.get(`https://rapido.zetsu.xyz/api/tk?search=${encodeURIComponent(searchQuery)}`);
    const videos = response.data.data;

    if (!videos || videos.length === 0) {
      api.setMessageReaction("❌", initialMessageID, (err) => {}, true);
      api.sendMessage("لم يتم العثور على مقاطع فيديو لما قمت بإدخاله.", event.threadID);
      return;
    }

    const videoData = videos[0];
    const videoUrl = videoData.video_url;

    const message = `✅ | نـتيجـة الـبـحـث :\n\n👤 | مـن طـرف : ${videoData.author}\n\n📄 | الـعـنـوان: ${videoData.title}\n\n💖 | الإعـجـابـات: ${videoData.likes}\n🗨️ | الـتـعـلـيـقـات: ${videoData.comments}\n🔁 | الـمـشـاركـات: ${videoData.shares}`;

    const filePath = path.join(__dirname, `/cache/tiktok_video.mp4`);
    const writer = fs.createWriteStream(filePath);

    const videoResponse = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });

    videoResponse.data.pipe(writer);

    writer.on('finish', () => {
      api.sendMessage(
        { body: message, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => {
          fs.unlinkSync(filePath);
          api.setMessageReaction("✅", initialMessageID, (err) => {}, true);
          api.unsendMessage(initialMessageID); // Delete initial search message
        }
      );
    });
  } catch (error) {
    console.error('Error:', error);
    api.sendMessage("حدث خطأ أثناء معالجة الطلب.", event.threadID);
  }
};
