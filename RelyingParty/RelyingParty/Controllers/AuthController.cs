using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fido2NetLib;
using Fido2NetLib.Development;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Mvc;

namespace RelyingParty.Controllers
{
    [Route("api/[controller]")]
    public class AuthController : Controller
    {
        private readonly Fido2 _fido2;
        private readonly string _origin;


        //Development temp storage, should be done with a proper persistence service
        private static readonly DevelopmentInMemoryStore DemoStorage = new DevelopmentInMemoryStore();
        private static CredentialCreateOptions RegisterOptions;
        private static AssertionOptions LoginOptions;

        public AuthController()
        {
            _origin = "http://localhost:4200";
            _fido2 = new Fido2(new Fido2Configuration
            {
                ServerDomain = "localhost",
                ServerName = "Meetup Demo Webauthn",
                Origin = _origin
            });
        }

        [HttpGet("registerOptions/{username}")]
        public JsonResult GetRegisterOptions(string username)
        {
            try
            {
                // 1. Get user from DB by username (in our example, auto create missing users)
                var user = DemoStorage.GetOrAddUser(username, () => new Fido2User
                {
                    DisplayName = "Display " + username,
                    Name = username,
                    Id = Encoding.UTF8.GetBytes(username) // byte representation of userID is required
                });

                // 2. Get user existing keys by username
                //List<PublicKeyCredentialDescriptor> existingKeys = new List<PublicKeyCredentialDescriptor>();
                List<PublicKeyCredentialDescriptor> existingKeys = DemoStorage.GetCredentialsByUser(user).Select(c => c.Descriptor).ToList();

                // 3. Create options
                var authenticatorSelection = AuthenticatorSelection.Default;
                authenticatorSelection.UserVerification = UserVerificationRequirement.Required;
                authenticatorSelection.AuthenticatorAttachment = AuthenticatorAttachment.Platform;
                var options = _fido2.RequestNewCredential(user, existingKeys, authenticatorSelection, AttestationConveyancePreference.Direct);

                // 4. Temporarily store options, session/in-memory cache/redis/db
                RegisterOptions = options;

                // 5. return options to client
                return Json(options);
            }
            catch (Exception e)
            {
                return Json(new CredentialCreateOptions { Status = "error", ErrorMessage = FormatException(e) });
            }
        }

        [HttpPost("register")]
        public async Task<JsonResult> Register([FromBody]AuthenticatorAttestationRawResponse attestationResponse)
        {
            // 1. get the options we sent the client
            var options = RegisterOptions;

            // 2. Create callback so that lib can verify credential id is unique to this user
            IsCredentialIdUniqueToUserAsyncDelegate callback = async (IsCredentialIdUniqueToUserParams args) =>
            {
                var users = await DemoStorage.GetUsersByCredentialIdAsync(args.CredentialId);
                if (users.Count > 0)
                    return false;

                return true;
            };

            try
            {

                // 2. Verify and make the credentials
                var success = await _fido2.MakeNewCredentialAsync(attestationResponse, options, callback);


                // 3. Store the credentials in db
                DemoStorage.AddCredentialToUser(options.User, new StoredCredential
                {
                    Descriptor = new PublicKeyCredentialDescriptor(success.Result.CredentialId),
                    PublicKey = success.Result.PublicKey,
                    UserHandle = success.Result.User.Id,
                    SignatureCounter = success.Result.Counter,
                    CredType = success.Result.CredType,
                    RegDate = DateTime.Now,
                    AaGuid = success.Result.Aaguid
                });

                // 4. return "ok" to the client
                return Json(success);
            }
            catch (Exception e)
            {
                return Json(new CredentialCreateOptions { Status = "error", ErrorMessage = FormatException(e) });
            }
        }

        [HttpGet("loginOptions/{username}")]
        public JsonResult GetLoginOptions(string username)
        {
            try
            {
                var existingCredentials = new List<PublicKeyCredentialDescriptor>();

                if (!string.IsNullOrEmpty(username))
                {
                    // 1. Get user from DB
                    var user = DemoStorage.GetUser(username);
                    if (user == null)
                        throw new ArgumentException("Username was not registered");

                    // 2. Get registered credentials from database
                    existingCredentials = DemoStorage.GetCredentialsByUser(user).Select(c => c.Descriptor).ToList();
                }

                var exts = new AuthenticationExtensionsClientInputs()
                {
                    SimpleTransactionAuthorization = "FIDO",
                    GenericTransactionAuthorization = new TxAuthGenericArg
                    {
                        ContentType = "text/plain",
                        Content = new byte[] { 0x46, 0x49, 0x44, 0x4F }
                    },
                    UserVerificationIndex = true,
                    Location = true,
                    UserVerificationMethod = true
                };

                // 3. Create options
                var uv = UserVerificationRequirement.Required;
                var options = _fido2.GetAssertionOptions(
                    existingCredentials,
                    uv,
                    exts
                );

                // 4. Temporarily store options, session/in-memory cache/redis/db
                LoginOptions = options;

                // 5. Return options to client
                return Json(options);
            }

            catch (Exception e)
            {
                return Json(new AssertionOptions { Status = "error", ErrorMessage = FormatException(e) });
            }

        }

        [HttpPost("login")]
        public async Task<JsonResult> Login([FromBody]AuthenticatorAssertionRawResponse assertionResponse)
        {
            try
            {
                // 1. Get the assertion options we sent the client
                var options = LoginOptions;

                // 2. Get registered credential from database
                var creds = DemoStorage.GetCredentialById(assertionResponse.Id);

                if (creds == null)
                {
                    throw new Exception("Unknown credentials");
                }

                // 3. Get credential counter from database
                var storedCounter = creds.SignatureCounter;

                // 4. Create callback to check if userhandle owns the credentialId
                IsUserHandleOwnerOfCredentialIdAsync callback = async (args) =>
                {
                    var storedCreds = await DemoStorage.GetCredentialsByUserHandleAsync(args.UserHandle);
                    return storedCreds.Exists(c => c.Descriptor.Id.SequenceEqual(args.CredentialId));
                };

                // 5. Make the assertion
                var res = await _fido2.MakeAssertionAsync(assertionResponse, options, creds.PublicKey, storedCounter, callback);

                // 6. Store the updated counter
                DemoStorage.UpdateCounter(res.CredentialId, res.Counter);

                // 7. return OK to client
                return Json(res);
            }
            catch (Exception e)
            {
                return Json(new AssertionVerificationResult { Status = "error", ErrorMessage = FormatException(e) });
            }
        }

        #region adminFunctions



        [HttpGet("users")]
        public Task<List<Fido2User>> GetUsers()
        {
            return DemoStorage.GetAllUsers();
        }
        [HttpGet("credentials")]
        public List<StoredCredential> GetCredentials()
        {
            return DemoStorage.GetCredentials();
        }

        [HttpGet("resetStorage")]
        public void ResetStorage()
        {
            DemoStorage.Reset();
        }

        private string FormatException(Exception e)
        {
            return string.Format("{0}{1}", e.Message, e.InnerException != null ? " (" + e.InnerException.Message + ")" : "");
        }
        #endregion

    }
}
